import express from "express";
const route = express.Router();
import { createReply, likeReply, deleteReply } from "../controllers/reply.controller";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";

route.post("/:commentId", checkAuthAndRefreshToken, createReply); // done
route.delete("/:replyId/:commentId", checkAuthAndRefreshToken, deleteReply); // done
route.put("/like/:replyId/:commentId", checkAuthAndRefreshToken, likeReply); // done

export default route;