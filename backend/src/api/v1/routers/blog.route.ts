import express from "express"
import { createBlog, getSingleBlog } from "../controllers/blog.controller";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";
import { upload } from "./user.route";
import { validateRole } from "../../../middlewares/validateRole";
const route = express.Router();

route.post("/", checkAuthAndRefreshToken, validateRole(["admin"]), upload.single("coverImage"), createBlog); // done
route.get("/:id", getSingleBlog); // done


export default route;