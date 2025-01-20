import { Request, Response } from "express";
import ejs from "ejs";
import path from "path";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import { createActivationToken } from "../../../utils/createActivationToken";
import sendMail from "../../../utils/sendMail";
import { setTokenCookie } from "../../../utils/setTokenCookie";
import { deleteTokenCookie } from "../../../utils/deleteTokenCookie";
import { redis } from "../../../config/redis";

// Register
export interface IUserRegister {
  name: string;
  email: string;
  password?: string;
}

export const registerUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    const isEmailExist = await User.findOne({ email });

    if (isEmailExist) {
      return res.status(400).json({
        success: false,
        message: "Email already exist",
      });
    }

    const user: IUserRegister = {
      name,
      email,
      password,
    };

    const activationToken = createActivationToken(user);

    const activationCode = activationToken.activationCode;

    const dataTosendToEmail = {
      user: {
        name: user.name,
      },
      activationCode,
      blogUrl: process.env.CLIENT_URL,
    };

    await ejs.renderFile(
      path.join(__dirname, "../../../views/activateUser.ejs"),
      dataTosendToEmail
    );

    await sendMail({
      email: user.email,
      subject: `${activationCode} is your activation code`,
      template: "activateUser.ejs",
      dataTosendToEmail,
    });

    return res.status(200).json({
      success: true,
      email: user.email,
      message: "Register successfully and need to activate your account",
      activationToken: activationToken.token,
    });
  } catch (error) {
    console.log("Error in register controller: ", error);
    return res.status(500).json({
      success: false,
      message: "Register failed",
    });
  }
};

// Activate
interface IActivationUser {
  activationToken: string;
  activationCode: string;
}

export const activateUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { activationCode, activationToken } = req.body as IActivationUser;

    const newUser: { user: IUser; activationCode: string } = jwt.verify(
      activationToken,
      process.env.ACTIVATION_TOKEN_SECRET as string
    ) as { user: IUser; activationCode: string };

    if (newUser.activationCode != activationCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid activation code",
      });
    }

    const { name, email, password } = newUser.user;

    const isEmailExist = await User.findOne({ email });

    if (isEmailExist) {
      return res.status(400).json({
        success: false,
        message: "Email already exist",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    return res.status(200).json({
      success: true,
      message: "Activate successfully",
      user,
    });
  } catch (error) {
    console.log("Error in activate controller: ", error);
    return res.status(500).json({
      success: false,
      message: "Activate failed",
    });
  }
};

// Login
interface ILoginData {
  email: string;
  password: string;
}

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body as ILoginData;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    setTokenCookie(user, res);
  } catch (error) {
    console.log("Error in login controller: ", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// Google Login
interface IGoogleLoginData {
  email: string;
  name: string;
  picture: string;
}

export const googleLogin = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email, name, picture } = req.body as IGoogleLoginData;

    if (!email || !name || !picture) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, name and picture",
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (user.picture && user.picture.url && !user.picture.public_id) {
        user.picture.url = picture;
        user.save();
      }
      setTokenCookie(user, res);
    } else {
      const newUser = await User.create({
        name,
        email,
        picture: {
          url: picture,
        },
      });

      user = newUser;
      setTokenCookie(user, res);
    }
  } catch (error) {
    console.log("Error in google login controller: ", error);
    return res.status(500).json({
      success: false,
      message: "Google login failed",
    });
  }
};

// Logout
export const logoutUser = async (req: any, res: Response): Promise<any> => {
  try {
    deleteTokenCookie(res);

    const userId = req.user?._id || "";

    await redis.del(userId);

    return res.status(200).json({
      success: true,
      message: "Logout successfully",
    });
  } catch (error) {
    console.log("Error in logout controller: ", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
