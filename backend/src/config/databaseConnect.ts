import mongoose from "mongoose";

export const databaseConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string).then(() => {
      console.log("Database connected");
    });
  } catch (error) {
    console.log(error);
  }
};
