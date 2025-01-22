import Comment from "../models/comment.model";
import Blog from "../models/blog.model";
import { Response } from "express";
import { redis } from "../../../config/redis";
import { populateBlog } from "./blog.controller";

// create comment
interface ICommentData {
  blog: string;
  content: string;
}

export const createComment = async (req: any, res: Response): Promise<any> => {
  try {
    const { content } = req.body as ICommentData;
    const blogId = req.params.blogId;
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const comment = await Comment.create({
      blog: blogId,
      content,
      user: req.user._id,
    });

    // push comment to blog.comments
    if (blog.comments) {
      blog.comments.push(comment._id as object);
      await blog.save();
    }

    const newBlogData = await populateBlog(blogId);
    await redis.set(
      `blog-${blogId}`,
      JSON.stringify(newBlogData),
      "EX",
      7 * 24 * 60 * 60
    );

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      blog: newBlogData,
      comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create comment",
    });
  }
};

// get single comment
export const getComment = async (req: any, res: Response): Promise<any> => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Comment fetched successfully",
      comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch comment",
    });
  }
};

export const deleteComment = async (req: any, res: Response): Promise<any> => {
  try {
    const commentId = req.params.commentId;
    const blogId = req.params.blogId;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // remove comment from blog.comments
    if (blog.comments) {
      blog.comments = blog.comments.filter(
        (id: object) => id.toString() !== commentId
      );
      await blog.save();
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });

    const populatedBlog = await populateBlog(blogId);
    await redis.set(
      `blog-${blog._id}`,
      JSON.stringify(populatedBlog),
      "EX",
      7 * 24 * 60 * 60
    );

    return null;
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete comment",
    });
  }
};

// like comment
export const likeComment = async (req: any, res: Response): Promise<any> => {
  try {
    const commentId = req.params.commentId;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }
    comment.likes && comment.likes.push(req.user._id as object);

    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment liked successfully",
    });

    const populatedBlog = await populateBlog(comment.blog as string);
    await redis.set(
      `blog-${comment.blog}`,
      JSON.stringify(populatedBlog),
      "EX",
      7 * 24 * 60 * 60
    );

    return null;
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to like comment",
    });
  }
};
