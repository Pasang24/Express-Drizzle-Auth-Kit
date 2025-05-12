import jwt from "jsonwebtoken";

export const generateSession = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as jwt.Secret);
};
