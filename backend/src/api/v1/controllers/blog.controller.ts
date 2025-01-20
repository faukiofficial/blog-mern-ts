import { Response } from "express";
import blogModel from "../models/blog.model";
import { uploadImage } from "../../../config/cloudinary";

// create blog
interface IBlogData {
  title: string;
  category: string;
  tags: string[];
  content: string;
  author?: string;
  coverImage?: {
    url: string;
    public_id: string;
  };
}

export const createBlog = async (req: any, res: Response): Promise<void> => {
  try {
    const { title, category, tags, content } = req.body as IBlogData;

    const blogData: IBlogData = {
      title,
      category,
      tags,
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

    const blog = await blogModel.create(blogData);

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to create blog" });
  }
};

// get single blog
interface IGetSingleBlog {
    id: string
}

export const getSingleBlog = async (req: any, res: Response) : Promise<any> => {
  try {
    const { id } = req.params as IGetSingleBlog;
    const blog = await blogModel
      .findById(id)
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
              }
            ],
          },
        ],
      });

    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      blog,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to fetch blog" });
  }
};
