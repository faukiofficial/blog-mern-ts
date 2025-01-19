import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { IUserRegister } from "../api/v1/controllers/auth.controller";
dotenv.config();

interface IActivationToken {
    token: string;
    activationCode: number;
}

export const createActivationToken = (user: IUserRegister): IActivationToken => {
  const activationCode = Math.floor(
    100000 + Math.random() * (999999 - 100000 + 1) + 100000
  );
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_TOKEN_SECRET as string,
    {
      expiresIn: "30m",
    }
  );

  return { token, activationCode };
};
