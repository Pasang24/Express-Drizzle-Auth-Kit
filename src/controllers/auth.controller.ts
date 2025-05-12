import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError";
import { generateSession } from "../utils/generateSession";
import { user } from "../db/schema/user";
import { and, eq } from "drizzle-orm";
import db from "../db";

type User = typeof user.$inferSelect;
type TokenData = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token: string;
};

type GitHubProfile = {
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
};

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: "public" | "private" | null;
};

const emailLogin = async (
  req: Request<{}, {}, Pick<User, "email" | "password">, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    const result = await db
      .select()
      .from(user)
      .where(and(eq(user.email, email), eq(user.provider, "email")));

    const currentUser = result[0];

    if (!currentUser) {
      throw new ApiError(401, "Invalid Email or Password");
    }

    const isPasswordMatch = await bcrypt.compare(
      password as string,
      currentUser.password as string
    );

    if (!isPasswordMatch) {
      throw new ApiError(401, "Invalid Email or Password");
    }

    generateSession(res, currentUser.id);

    const { password: _, ...safeUser } = currentUser;

    res.json({ user: safeUser });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req: Request, res: Response) => {
  const redirectUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      redirect_uri: `${process.env.BACKEND_URL}/auth/google/callback`,
      response_type: "code",
      scope: "email profile",
    });

  res.redirect(redirectUrl);
};

const googleLoginCallback = async (
  req: Request<{}, {}, {}, { code?: string; error?: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, error } = req.query;

    // if there is any error during the oauth flow then we redirect back to the frontend login page
    if (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login`);
      return;
    }
    // if the user tries to access the callback route directly without getting redirected
    // we will not have code in the request query so we return it as a bad request
    if (!code) {
      throw new ApiError(400, "Missing authorization code");
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: `${process.env.BACKEND_URL}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      // const errorData = await tokenRes.json();
      throw new ApiError(400, "Invalid or expired code");
    }

    const tokenData: TokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    const profile: Pick<User, "email" | "name"> = await profileRes.json();

    const result = await db
      .insert(user)
      .values({
        name: profile.name,
        email: profile.email,
        provider: "google",
      })
      .onConflictDoNothing({ target: [user.email, user.provider] })
      .returning();

    let currentUser = result[0];

    if (!currentUser) {
      const response = await db
        .select()
        .from(user)
        .where(and(eq(user.email, profile.email), eq(user.provider, "google")));

      currentUser = response[0];

      generateSession(res, currentUser.id);

      // replace the redirect url with your frontend url
      res.redirect(`${process.env.FRONTEND_URL}`);
    }
  } catch (error) {
    next(error);
  }
};

const gitHubLogin = async (req: Request, res: Response, next: NextFunction) => {
  const redirectUrl =
    "https://github.com/login/oauth/authorize?" +
    new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID as string,
      redirect_uri: `${process.env.BACKEND_URL}/auth/github/callback`,
      prompt: "select_account",
      scope: "read:user user:email",
    });

  res.redirect(redirectUrl);
};

const gitHubLoginCallback = async (
  req: Request<{}, {}, {}, { code: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;

    if (!code) {
      throw new ApiError(400, "Missing Authorization Code");
    }

    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          code,
          client_id: process.env.GITHUB_CLIENT_ID as string,
          client_secret: process.env.GITHUB_CLIENT_SECRET as string,
          redirect_uri: `${process.env.BACKEND_URL}/auth/github/callback`,
        }),
      }
    );

    const tokenData = await tokenRes.json();

    if ("error" in tokenData) {
      throw new ApiError(400, tokenData.error_description);
    }

    const accessToken = tokenData.access_token;

    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const profile: GitHubProfile = await profileRes.json();

    if (!profile.email) {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      const emailList: GitHubEmail[] = await emailRes.json();

      const primaryEmail = emailList.find(
        (emailItem) => emailItem.primary && emailItem.verified
      ) as GitHubEmail;

      profile.email = primaryEmail.email;
    }

    const result = await db
      .insert(user)
      .values({
        email: profile.email as string,
        name: profile.name || profile.login,
        provider: "github",
      })
      .onConflictDoNothing({ target: [user.email, user.provider] })
      .returning();

    let currentUser = result[0];

    if (!currentUser) {
      const response = await db
        .select()
        .from(user)
        .where(and(eq(user.email, profile.email), eq(user.provider, "github")));

      currentUser = response[0];
    }

    generateSession(res, currentUser.id);

    res.redirect(`${process.env.FRONTEND_URL}`);
  } catch (error) {
    next(error);
  }
};

export const authController = {
  emailLogin,
  googleLogin,
  googleLoginCallback,
  gitHubLogin,
  gitHubLoginCallback,
};
