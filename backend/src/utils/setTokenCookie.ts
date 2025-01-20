import jwt from "jsonwebtoken";
import { IUser } from "../api/v1/models/user.model";
import { Response } from "express";
import { redis } from "../config/redis";

export const setTokenCookie = (user: IUser, res: Response) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
    expiresIn: "10d",
  });

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_REFRESH_TOKEN as string,
    {
      expiresIn: "1m",
    }
  );

  res.cookie("token", token, {
    httpOnly: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 24 * 60 * 1000,
    expires: new Date(Date.now() + 10 * 60 * 24 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 60 * 1000,
    expires: new Date(Date.now() + 1 * 60 * 1000),
  });

  if (user.password) user.password = undefined;

  redis.set(user._id, JSON.stringify(user) as any, "EX", 10 * 60 * 24 * 60);

  return res.status(200).json({
    success: true,
    message: "Login successfully",
    user,
  });
};
