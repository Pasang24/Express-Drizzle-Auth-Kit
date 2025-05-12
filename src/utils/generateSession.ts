import { Response } from "express";
import jwt from "jsonwebtoken";

export const generateSession = (res: Response, id: string) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET as jwt.Secret);

  const NODE_ENV = process.env.NODE_ENV;

  res.cookie("session", token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: NODE_ENV === "production" ? "none" : "lax",
  });
};
