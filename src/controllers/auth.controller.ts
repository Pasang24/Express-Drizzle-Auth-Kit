import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { user } from "../db/schema/user";
import { and, eq } from "drizzle-orm";
import db from "../db";

type User = typeof user.$inferSelect;

const loginUser = async (
  req: Request<{}, {}, Pick<User, "email" | "password" | "provider">, {}>,
  res: Response
) => {
  const { email, password, provider = "email" } = req.body;
  const result = await db
    .select()
    .from(user)
    .where(and(eq(user.email, email), eq(user.provider, provider)));

  const currentUser = result[0];

  switch (provider) {
    case "email":
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

      const sessionToken = jwt.sign(
        { id: currentUser.id },
        process.env.JWT_SECRET as jwt.Secret
      );

      res.cookie("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.json({ user: currentUser });
      break;
    case "google":
      break;
    case "github":
      break;
    default:
      const unknownProvider: never = provider;
      console.log(`Unknown Provider: ${unknownProvider}`);
  }
};

export const authController = { loginUser };
