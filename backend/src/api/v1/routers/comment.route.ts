import express from "express";
const route = express.Router();
import { createComment, getComment, deleteComment } from "../controllers/comment.controller";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";

route.post("/:blogId", checkAuthAndRefreshToken, createComment);
route.get("/:commentId", getComment);
route.delete("/:commentId/:blogId", checkAuthAndRefreshToken, deleteComment);

export default route;