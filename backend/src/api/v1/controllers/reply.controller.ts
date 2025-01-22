import Reply from "../models/reply.model";
import Comment from "../models/comment.model";
import { Response } from "express";
import { populateBlog } from "./blog.controller";
import { redis } from "../../../config/redis";

// create reply
interface IReplyData {
    content: string;
}

export const createReply = async (req: any, res: Response) : Promise<any> => {
    try {
        const { content } = req.body as IReplyData;
        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        const reply = await Reply.create({ content, user: req.user._id, comment: commentId });

        // push reply to comment.replies
        if (comment.replies) {
            comment.replies.push(reply._id as object);
            await comment.save();
        }

        const populatedBlog = await populateBlog(comment.blog as string);
        await redis.set(`blog-${comment.blog}`, JSON.stringify(populatedBlog), "EX", 7 * 24 * 60 * 60);

        return res.status(201).json({
            success: true,
            message: "Reply created successfully",
            reply,
        })
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create reply",
        });
    }
};

// delete reply
export const deleteReply = async (req: any, res: Response) : Promise<any> => {
    try {
        const replyId = req.params.replyId;
        const commentId = req.params.commentId;
        const reply = await Reply.findById(replyId);
        if (!reply) {
            return res.status(404).json({
                success: false,
                message: "Reply not found",
            });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        // remove reply from comment.replies
        if (comment.replies) {
            // pake filter
            comment.replies = comment.replies.filter((id: object) => id.toString() !== replyId);
            await comment.save();
        }

        // delete reply
        await Reply.findByIdAndDelete(replyId);

        const populatedBlog = await populateBlog(comment.blog as string);
        await redis.set(`blog-${comment.blog}`, JSON.stringify(populatedBlog), "EX", 7 * 24 * 60 * 60);

        return res.status(200).json({
            success: true,
            message: "Reply deleted successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to delete reply",
        });
    }
};

// like reply
export const likeReply = async (req: any, res: Response) : Promise<any> => {
    try {
        const replyId = req.params.replyId;
        const commentId = req.params.commentId;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        } 
        
        const reply = await Reply.findById(replyId);
        if (!reply) {
            return res.status(404).json({
                success: false,
                message: "Reply not found",
            });
        }
        reply.likes && reply.likes.push(req.user._id as object);

        await reply.save();

        const populatedBlog = await populateBlog(comment.blog as string);
        await redis.set(`blog-${comment.blog}`, JSON.stringify(populatedBlog), "EX", 7 * 24 * 60 * 60);

        return res.status(200).json({
            success: true,
            message: "Reply liked successfully",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to like reply",
        });
    }
};