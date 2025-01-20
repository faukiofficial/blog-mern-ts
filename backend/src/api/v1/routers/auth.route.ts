import express from "express";
import { registerUser, activateUser, loginUser, logoutUser } from "../controllers/auth.controller";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";
const route = express.Router();

route.post("/register", registerUser); // done
route.post("/activate", activateUser); // done
route.post("/login", loginUser); // done
route.post("/logout", checkAuthAndRefreshToken, logoutUser); // done

export default route