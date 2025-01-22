import { Response } from "express";
import Blog from "../models/blog.model";
import { deleteImage, uploadImage } from "../../../config/cloudinary";
import { redis } from "../../../config/redis";
import "../models/comment.model";
import "../models/user.model";
import "../models/reply.model";

export const populateBlog = async (id: string) => {
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

    const blogData: IBlogData = {
      title,
      category,
      tags: tags ? JSON.parse(tags) : [],
      content,
      author: req.user._id,
    };

    if (req.file) {
      const fileBuffer = req.file.buffer.toString("base64");
      const imageData = `data:image/jpeg;base64,${fileBuffer}`;
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
      `blog-${blog._id}`,
      JSON.stringify(populatedBlog),
      "EX",
      7 * 24 * 60 * 60
    ); // 7 days

    // push the blog to "AllBlogs" in redis
    await redis.lpush("AllBlogs", JSON.stringify(populatedBlog));
  } catch (error) {
    console.log("Error in create blog controller", error);
    res.status(400).json({ success: false, message: "Failed to create blog" });
  }
};

// get all blogs
interface IGetAllBlogs {
  querySearch?: string;
  category?: string;
  tags?: string;
  page?: number;
  limit?: number;
  sort?: string;
  sortBy?: string;
}

export const getAllBlogs = async (req: any, res: Response): Promise<any> => {
  try {
    const {
      querySearch,
      category,
      tags,
      page = 1,
      limit = 10,
      sort = "desc",
      sortBy = "createdAt",
    } = req.query as IGetAllBlogs;

    const filters: any = {};

    if (querySearch) {
      filters.$or = [
        { title: { $regex: querySearch, $options: "i" } },
        { content: { $regex: querySearch, $options: "i" } },
      ];
    }

    if (category) {
      filters.category = category;
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filters.tags = { $all: tagsArray };
    }

    // pagination and sorting
    const pageNumber = page || 1;
    const pageSize = limit || 10;
    const skip = (pageNumber - 1) * pageSize;
    const sortOrder = sort === "asc" ? 1 : -1;
    const sortField = sortBy || "createdAt";

    const blogsList = await redis.lrange("AllBlogs", 0, -1);
    const cachedBlogs = blogsList.map((blog: any) => JSON.parse(blog));

    if (cachedBlogs) {
      let filteredBlogs = cachedBlogs;

      // Filter by query search
      if (querySearch) {
        filteredBlogs = filteredBlogs.filter(
          (blog: any) =>
            blog.title.toLowerCase().includes(querySearch.toLowerCase()) ||
            blog.content.toLowerCase().includes(querySearch.toLowerCase())
        );
      }

      // Filter by category
      if (category) {
        filteredBlogs = filteredBlogs.filter(
          (blog: any) => blog.category === category
        );
      }

      // Filter by tags
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        filteredBlogs = filteredBlogs.filter((blog: any) =>
          tagsArray.every((tag: string) => blog.tags.includes(tag))
        );
      }

      // Sort blogs
      filteredBlogs.sort((a: any, b: any) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

        if (typeof fieldA === "string" && typeof fieldB === "string") {
          return sort === "asc"
            ? fieldA.localeCompare(fieldB)
            : fieldB.localeCompare(fieldA);
        }

        return sort === "asc" ? fieldA - fieldB : fieldB - fieldA;
      });

      // Pagination
      const totalBlogs = filteredBlogs.length;
      const paginatedBlogs = filteredBlogs.slice(skip, skip + pageSize);

      return res.status(200).json({
        success: true,
        from: "redis",
        message: "Blogs fetched successfully",
        blogs: paginatedBlogs,
        totalBlogs: totalBlogs,
        totalPages: Math.ceil(totalBlogs / pageSize),
        currentPage: pageNumber,
      });
    }

    const blogs = await Blog.find()
      .select("-comments")
      .populate({
        path: "author",
        select: "name picture",
      })
      .sort({ sortField: sortOrder })
      .skip(skip)
      .limit(pageSize);

    const totalBlogs = await Blog.countDocuments(filters);

    const result = {
      blogs,
      totalBlogs,
      totalPages: Math.ceil(totalBlogs / pageSize),
      currentPage: pageNumber,
    };

    res.status(200).json({
      success: true,
      from: "mongo",
      message: "Blogs fetched successfully",
      ...result,
    });

    await redis.del("AllBlogs");
    for (const blog of blogs) {
      await redis.rpush("AllBlogs", JSON.stringify(blog));
    }
    await redis.expire("AllBlogs", 7 * 24 * 60 * 60);
  } catch (error) {
    console.log("Error in get all blogs controller", error);
    res.status(400).json({ success: false, message: "Failed to fetch blogs" });
  }
};

// get single blog
interface IGetSingleBlog {
  id: string;
}

export const getSingleBlog = async (req: any, res: Response): Promise<any> => {
  try {
    const { id } = req.params as IGetSingleBlog;

    const cachedBlog = await redis.get(`blog-${id}`);

    if (cachedBlog) {
      return res.status(200).json({
        success: true,
        message: "Blog fetched successfully",
        blog: JSON.parse(cachedBlog),
      });
    }

    const blog = await populateBlog(id);

    await redis.set(`blog-${id}`, JSON.stringify(blog), "EX", 7 * 24 * 60 * 60); // 7 days

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
      tags: tags ? JSON.parse(tags) : blog.tags,
      content,
    };

    if (req.file) {
      if (blog.coverImage?.public_id) {
        await deleteImage(blog.coverImage.public_id);
      }

      const fileBuffer = req.file.buffer.toString("base64");
      const imageData = `data:image/jpeg;base64,${fileBuffer}`;
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
    await redis.set(
      `blog-${id}`,
      JSON.stringify(populatedBlog),
      "EX",
      7 * 24 * 60 * 60
    ); // 7 days

    // Update list AllBlogs di Redis
    const allBlogs = await redis.lrange("AllBlogs", 0, -1); // Ambil semua elemen dari list
    const updatedBlogs = allBlogs.map((blog) => {
      const parsedBlog = JSON.parse(blog);
      if (parsedBlog._id === id) {
        return JSON.stringify(populatedBlog); // Perbarui blog yang sesuai
      }
      return blog; // Biarkan elemen lainnya tetap sama
    });

    // Hapus list lama dan tambahkan list baru
    await redis.del("AllBlogs");
    await redis.rpush("AllBlogs", ...updatedBlogs);
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

    await redis.del(`blog-${id}`);
    // Hapus elemen dari list AllBlogs di Redis
    const allBlogs = await redis.lrange("AllBlogs", 0, -1); // Ambil semua elemen dalam list
    const filteredBlogs = allBlogs.filter((blog) => {
      const parsedBlog = JSON.parse(blog);
      return parsedBlog._id !== id; // Pertahankan elemen yang ID-nya tidak sesuai
    });

    // Hapus list lama dan tambahkan list yang sudah difilter
    await redis.del("AllBlogs");
    if (filteredBlogs.length > 0) {
      await redis.rpush("AllBlogs", ...filteredBlogs);
    }
  } catch (error) {
    console.log("Error in delete blog controller", error);
    res.status(400).json({ success: false, message: "Failed to delete blog" });
  }
};
