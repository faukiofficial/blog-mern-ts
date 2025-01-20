import express from "express";
import { registerUser, activateUser, loginUser, logoutUser } from "../controllers/auth.controller";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";
const route = express.Router();

route.post("/register", registerUser);
route.post("/activate", activateUser);
route.post("/login", loginUser);
route.post("/logout", checkAuthAndRefreshToken, logoutUser);

export default route