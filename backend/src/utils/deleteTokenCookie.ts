import { Response } from "express";

export const deleteTokenCookie = (res: Response): void => {
    res.clearCookie("token", {
        httpOnly: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
    });
    res.clearCookie("refreshToken", {
        httpOnly: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
    });
}