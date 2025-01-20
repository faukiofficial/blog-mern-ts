import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file: any, folder: string) => {
  try {
    const result = await cloudinary.uploader.upload(file, { folder: folder });
    return result;
  } catch (error) {
    console.log("Error in uploadImage: ", error);
  }
};

export const deleteImage = async (public_id: string) => {
  try {
    return await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.log("Error in deleteImage: ", error);
  }
};