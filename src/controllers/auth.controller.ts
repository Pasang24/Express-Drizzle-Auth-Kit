import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { user } from "../db/schema/user";
import { and, eq } from "drizzle-orm";
import db from "../db";

type User = typeof user.$inferSelect;

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
};

export const authController = { emailLogin };
