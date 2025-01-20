import express from "express";
import { checkAuthAndRefreshToken } from "../../../middlewares/checkAuthAndRefreshToken";
import {
  me,
  updateUser,
  activateNewEmail,
  updatePassword,
  activatePasswordChange,
  forgetPassword,
  activateForgetPassword,
  deleteAccount,
} from "../controllers/user.controller";
const router = express.Router();
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/me", checkAuthAndRefreshToken, me);
router.put(
  "/update",
  checkAuthAndRefreshToken,
  upload.single("picture"),
  updateUser
);
router.post("/activate-new-email", checkAuthAndRefreshToken, activateNewEmail);
router.post("/update-password", checkAuthAndRefreshToken, updatePassword);
router.post(
  "/activate-password-change",
  checkAuthAndRefreshToken,
  activatePasswordChange
);
router.post("/forget-password", checkAuthAndRefreshToken, forgetPassword);
router.post(
  "/activate-forget-password",
  checkAuthAndRefreshToken,
  activateForgetPassword
);
router.delete("/delete-account", checkAuthAndRefreshToken, deleteAccount);

export default router;
