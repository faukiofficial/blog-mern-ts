import { Response } from "express";
import Blog from "../models/blog.model";
import { deleteImage, uploadImage } from "../../../config/cloudinary";
import { redis } from "../../../config/redis";
import "../models/comment.model";
import "../models/user.model";
import "../models/reply.model";

const populateBlog = async (id: string) => {
  return await Blog.findById(id)
    .populate({
      path: "author",
      select: "name picture",
    })
    .populate({
      path: "likes",
      select: "name picture",
    })
    .populate({
      path: "comments",
      populate: [
        {
          path: "user",
          select: "name picture",
        },
        {
          path: "likes",
          select: "name picture",
        },
        {
          path: "replies",
          populate: [
            {
              path: "user",
              select: "name picture",
            },
            {
              path: "likes",
              select: "name picture",
            },
          ],
        },
      ],
    });
};

// create blog
interface IBlogData {
  title: string;
  category: string;
  tags?: string;
  content: string;
  author?: string;
  coverImage?: {
    url: string;
    public_id: string;
  };
}

export const createBlog = async (req: any, res: Response): Promise<any> => {
  try {
    const { title, category, tags, content } = req.body as IBlogData;

    console.log("tags", typeof tags);

    const blogData: IBlogData = {
      title,
      category,
      tags: tags ? JSON.parse(tags) : [],
      content,
      author: req.user._id,
    };

    if (req.file) {
      const fileBuffer = req.file.buffer.toString("base64");
      const imageData = `data:${req.file.mimetype};base64,${fileBuffer}`;
      const result = await uploadImage(imageData, "almuhsiny/blogCoverImage");

      if (result) {
        blogData.coverImage = {
          url: result.secure_url,
          public_id: result.public_id,
        };
      }
    }

    const blog = await Blog.create(blogData);

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog,
    });

    const populatedBlog = await populateBlog(blog._id);
    await redis.set(
      blog._id,
      JSON.stringify(populatedBlog),
      "EX",
      7 * 24 * 60 * 60
    ); // 7 days
  } catch (error) {
    console.log("Error in create blog controller", error);
    res.status(400).json({ success: false, message: "Failed to create blog" });
  }
};

// get single blog
interface IGetSingleBlog {
  id: string;
}

export const getSingleBlog = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params as IGetSingleBlog;

    const cachedBlog = await redis.get(id);

    if (cachedBlog) {
      return res.status(200).json({
        success: true,
        message: "Blog fetched successfully",
        blog: JSON.parse(cachedBlog),
      });
    }

    const blog = await populateBlog(id);

    await redis.set(id, JSON.stringify(blog), "EX", 7 * 24 * 60 * 60); // 7 days

    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      blog,
    });
  } catch (error) {
    console.log("Error in get single blog controller", error);
    res.status(400).json({ success: false, message: "Failed to fetch blog" });
  }
};

// update blog

export const updateBlog = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, category, tags, content } = req.body as IBlogData;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const blogData: IBlogData = {
      title,
      category,
      tags: tags ? JSON.parse(tags) : [],
      content,
    };

    if (req.file) {
      if (blog.coverImage?.public_id) {
        await deleteImage(blog.coverImage.public_id);
      }

      const fileBuffer = req.file.buffer.toString("base64");
      const imageData = `data:${req.file.mimetype};base64,${fileBuffer}`;
      const result = await uploadImage(imageData, "almuhsiny/blogCoverImage");

      if (result) {
        blogData.coverImage = {
          url: result.secure_url,
          public_id: result.public_id,
        };
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, blogData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });

    const populatedBlog = await populateBlog(id);
    await redis.set(id, JSON.stringify(populatedBlog), "EX", 7 * 24 * 60 * 60); // 7 days
  } catch (error) {
    console.log("Error in update blog controller", error);
    res.status(400).json({ success: false, message: "Failed to update blog" });
  }
};

// delete blog
export const deleteBlog = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id);

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    if (blog.coverImage?.public_id) {
      await deleteImage(blog.coverImage.public_id);
    }

    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });

    await redis.del(id);
  } catch (error) {
    console.log("Error in delete blog controller", error);
    res.status(400).json({ success: false, message: "Failed to delete blog" });
  }
};
