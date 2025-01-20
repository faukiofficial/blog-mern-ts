import { Response } from "express";
import userModel from "../models/user.model";
import { deleteImage, uploadImage } from "../../../config/cloudinary";
import { createActivationToken } from "../../../utils/createActivationToken";
import jwt, { JwtPayload } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../../../utils/sendMail";
import { deleteTokenCookie } from "../../../utils/deleteTokenCookie";

// Me
export const me = async (req: any, res: Response) => {
  try {
    const user = await userModel.findById(req.user._id).select("-password");
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// Update User
interface IUserUpdate {
  name?: string;
  email?: string;
  password?: string;
  picture?: any;
  bio?: string;
  role?: string;
}

export const updateUser = async (req: any, res: Response) : Promise<any> => {
  try {
    const { name, email, bio } = req.body as IUserUpdate;

    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    let picture;

    if (req.file) {
      if (req.user.picture?.public_id) {
        await deleteImage(req.user.picture.public_id);
      }

      const fileBuffer = req.file.buffer.toString("base64");
      const imageData = `data:${req.file.mimetype};base64,${fileBuffer}`;
      const result = await uploadImage(imageData, "almuhsiny/profilePicture");

      if (result) {
        picture = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }
    }

    if (email !== user.email) {
      const isEmailExist = await userModel.findOne({ email });

      if (isEmailExist) {
        return res
          .status(400)
          .json({ success: false, message: "Email already exist" });
      }

      const activationToken = createActivationToken({
        name: name || user.name,
        email: email || user.email,
        picture,
        bio: bio || user.bio,
      });

      const activationCode = activationToken.activationCode;

      const dataTosendToEmail = {
        user: {
          name: name || user.name,
        },
        activationCode,
        blogUrl: process.env.CLIENT_URL,
      };

      ejs.renderFile(
        path.join(__dirname, "../../../views/activateEmailChange.ejs"),
        dataTosendToEmail
      );

      await sendMail({
        email: email || user.email,
        subject: `${activationCode} is your activation code`,
        template: "activateEmailChange.ejs",
        dataTosendToEmail,
      });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.picture = picture || user.picture;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User updated successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Update user failed" });
  }
};

// activate new email
export const activateNewEmail = async (req: any, res: Response) : Promise<any> => {
  try {
    const { activationCode, activationToken } = req.body;

    const newUser = jwt.verify(
      activationToken,
      process.env.ACTIVATION_TOKEN_SECRET as string
    ) as JwtPayload;

    if (!newUser) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activation token" });
    }

    if (newUser.activationCode != activationCode) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activation code" });
    }

    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.email = newUser.email;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Email activated successfully", user });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Email activation failed" });
  }
};

// update password
export const updatePassword = async (req: any, res: Response) : Promise<any> => {
  try {
    const { oldPassword } = req.body;

    if (!oldPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide old password" });
    }

    const user = await userModel.findById(req.user._id).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await user.comparePassword(oldPassword);

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const activationToken = createActivationToken({
      name: user.name,
      email: user.email,
      picture: user.picture,
      bio: user.bio,
    });

    const activationCode = activationToken.activationCode;

    const dataTosendToEmail = {
      user: {
        name: user.name,
      },
      activationCode,
      blogUrl: process.env.CLIENT_URL,
    };

    ejs.renderFile(
      path.join(__dirname, "../../../views/activatePasswordChange.ejs"),
      dataTosendToEmail
    );

    await sendMail({
      email: user.email,
      subject: `${activationCode} is your activation code`,
      template: "activatePasswordChange.ejs",
      dataTosendToEmail,
    });

    res.status(200).json({
      success: true,
      message: "Change password request sent, check email",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Change password request failed" });
  }
};

// update password activation
export const activatePasswordChange = async (req: any, res: Response) : Promise<any> => {
  try {
    const { activationCode, activationToken } = req.body;

    const newUser = jwt.verify(
      activationToken,
      process.env.ACTIVATION_TOKEN_SECRET as string
    ) as JwtPayload;

    if (!newUser) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activation token" });
    }

    if (newUser.activationCode != activationCode) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activation code" });
    }

    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.password = newUser.password;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Password change failed" });
  }
};

// forget password
export const forgetPassword = async (req: any, res: Response) : Promise<any> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const activationToken = createActivationToken({
      name: user.name,
      email: user.email,
      picture: user.picture,
      bio: user.bio,
    });

    const activationCode = activationToken.activationCode;

    const dataTosendToEmail = {
      user: {
        name: user.name,
      },
      activationCode,
      blogUrl: process.env.CLIENT_URL,
    };

    ejs.renderFile(
      path.join(__dirname, "../../../views/activateChangePassword.ejs"),
      dataTosendToEmail
    );

    await sendMail({
      email: user.email,
      subject: `${activationCode} is your activation code`,
      template: "activateChangePassword.ejs",
      dataTosendToEmail,
    });

    res.status(200).json({
      success: true,
      message: "Change password request sent, check email",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Change password request failed" });
  }
};

// forget password activation
export const activateForgetPassword = async (req: any, res: Response) : Promise<any> => {
  try {
    const { activationCode, activationToken, newPassword } = req.body;

    const newUser = jwt.verify(
      activationToken,
      process.env.ACTIVATION_TOKEN_SECRET as string
    ) as JwtPayload;

    if (!newUser) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activation token" });
    }

    if (newUser.activationCode != activationCode) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid activation code" });
    }

    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.password = newUser.password;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password changed successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Password change failed" });
  }
};

// delete account
export const deleteAccount = async (req: any, res: Response) : Promise<any> => {
  try {
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await userModel.findByIdAndDelete(req.user._id);

    deleteTokenCookie(res);

    res
      .status(200)
      .json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Account deletion failed" });
  }
};
