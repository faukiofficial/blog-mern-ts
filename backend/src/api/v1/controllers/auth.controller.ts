import { Request, Response } from "express";
import ejs from "ejs";
import path from "path";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import { createActivationToken } from "../../../utils/createActivationToken";
import sendMail from "../../../utils/sendMail";

// Register
export interface IUserRegister {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async (req: Request, res: Response): Promise<any> => {
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
    console.log(error);
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

export const activateUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { activationCode, activationToken } = req.body as IActivationUser;

    const newUser: { user: IUser; activationCode: string} = jwt.verify(
      activationToken,
      process.env.ACTIVATION_TOKEN_SECRET as string
    ) as { user: IUser; activationCode: string};

    console.log(newUser);

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
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Activate failed",
    });
  }
};
