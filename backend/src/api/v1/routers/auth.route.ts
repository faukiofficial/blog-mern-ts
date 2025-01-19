import express from "express";
import { registerUser, activateUser } from "../controllers/auth.controller";
const route = express.Router();

route.post("/register", registerUser);
route.post("/activate", activateUser);

export default route