import jwt from "jsonwebtoken";
import { IUser } from "../api/v1/models/user.model";
import { Response } from "express";
import { redis } from "../config/redis";

export const setTokenCookie = (user: IUser, res: Response) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
    expiresIn: "5m",
  });

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET_REFRESH_TOKEN as string,
    {
      expiresIn: "7d",
    }
  );

  res.cookie("token", token, {
    httpOnly: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 5 * 60 * 1000,
    expires: new Date(Date.now() + 5 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 60 * 24 * 60 * 1000, // 7 days
    expires: new Date(Date.now() + 7 * 60 * 24 * 60 * 1000),
  });

  if (user.password) user.password = undefined;

  redis.set(user._id, JSON.stringify(user) as any, "EX", 7 * 60 * 24 * 60); // 7 days

  return res.status(200).json({
    success: true,
    message: "Login successfully",
    user,
  });
};
