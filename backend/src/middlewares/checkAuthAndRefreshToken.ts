import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { redis } from "../config/redis";
import userModel from "../api/v1/models/user.model";
import { setTokenCookie } from "../utils/setTokenCookie";

export const checkAuthAndRefreshToken = async (
  req: any,
  res: any,
  next: any
) => {
  const token = req.cookies.token;
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken && !token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as Secret
      ) as JwtPayload;
      let user = await redis.get(decoded.id);
      if (user) {
        req.user = JSON.parse(user);
        return next();
      } else {
        user = await userModel.findById(decoded.id);
        if (user) {
          await redis.set(decoded.id, JSON.stringify(user));
          req.user = user;
          return next();
        }
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
  } else {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET_REFRESH_TOKEN as Secret
      ) as JwtPayload;

      let user = await redis.get(decoded.id);
      if (user) {
        req.user = JSON.parse(user);
        setTokenCookie(req.user, res);
        return next();
      } else {
        user = await userModel.findById(decoded.id);
        if (user) {
          await redis.set(decoded.id, JSON.stringify(user));
          req.user = user;
          setTokenCookie(req.user, res);
          return next();
        }
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
  }
};
