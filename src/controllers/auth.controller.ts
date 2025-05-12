import { Request, Response } from "express";
import bcrypt from "bcrypt";
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

const emailLogin = async (
  req: Request<{}, {}, Pick<User, "email" | "password">, {}>,
  res: Response
) => {
  const { email, password } = req.body;
  const result = await db
    .select()
    .from(user)
    .where(and(eq(user.email, email), eq(user.provider, "email")));

  const currentUser = result[0];

  if (!currentUser) {
    res.status(401).json({ message: "Invalid Email or Password" });
    return;
  }

  const isPasswordMatch = await bcrypt.compare(
    password as string,
    currentUser.password as string
  );

  if (!isPasswordMatch) {
    res.status(401).json({ message: "Invalid Email or Password" });
    return;
  }

  const sessionToken = generateSession(currentUser.id);

  res.cookie("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  const { password: _, ...safeUser } = currentUser;

  res.json(safeUser);
};

const googleLogin = async (req: Request, res: Response) => {
  console.log(process.env.BACKEND_URL);
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
  req: Request<{}, {}, {}, { code: string }>,
  res: Response
) => {
  const { code } = req.query;

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

    const sessionToken = generateSession(currentUser.id);

    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    console.log(currentUser);

    // replace the redirect url with your frontend url
    res.redirect(`${process.env.FRONTEND_URL}`);
  }
};

export const authController = { emailLogin, googleLogin, googleLoginCallback };
