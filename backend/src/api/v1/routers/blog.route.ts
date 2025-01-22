import express from "express"
import { createBlog, getAllBlogs, getSingleBlog, updateBlog, deleteBlog } from "../controllers/blog.controller";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";
import { upload } from "./user.route";
import { validateRole } from "../../../middlewares/validateRole";
const route = express.Router();

route.post("/", checkAuthAndRefreshToken, validateRole(["admin"]), upload.single("coverImage"), createBlog); // done
route.get("/", getAllBlogs); // done
route.get("/:id", getSingleBlog); // done
route.put("/:id", checkAuthAndRefreshToken, validateRole(["admin"]), upload.single("coverImage"), updateBlog); // done
route.delete("/:id", checkAuthAndRefreshToken, validateRole(["admin"]), deleteBlog); // done

export default route;