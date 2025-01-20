import express from "express";
import { registerUser, activateUser, loginUser, googleLogin, logoutUser } from "../controllers/auth.controller";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";
const route = express.Router();

route.post("/register", registerUser); // done
route.post("/activate", activateUser); // done
route.post("/login", loginUser); // done
route.post("/google-login", googleLogin);
route.post("/logout", checkAuthAndRefreshToken, logoutUser); // done

export default route