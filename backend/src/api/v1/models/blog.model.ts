import mongoose from "mongoose";

export interface IBlog extends mongoose.Document {
    title: string;
    author: object;
    category: string;
    tags?: string[];
    coverImage: string;
    content: string;
    views?: number;
    likes?: object[];
    comments?: object[];
}

const blogSchema: mongoose.Schema<IBlog> = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  tags: [
    {
      type: String,
    },
  ],
  coverImage: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
}, { timestamps: true });

export default mongoose.model("Blog", blogSchema);
