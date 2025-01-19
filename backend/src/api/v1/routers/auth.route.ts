import express from "express";
import { registerUser, activateUser, loginUser } from "../controllers/auth.controller";
const route = express.Router();

route.post("/register", registerUser);
route.post("/activate", activateUser);
route.post("/login", loginUser);

export default route