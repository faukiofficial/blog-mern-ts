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
export const upload = multer({ storage });

router.get("/me", checkAuthAndRefreshToken, me); // done
router.put(
  "/update",
  checkAuthAndRefreshToken,
  upload.single("picture"),
  updateUser
); // done
router.post("/activate-new-email", checkAuthAndRefreshToken, activateNewEmail); // done
router.post("/update-password", checkAuthAndRefreshToken, updatePassword); // done
router.post(
  "/activate-password-change",
  checkAuthAndRefreshToken,
  activatePasswordChange
); // done
router.post("/forget-password", checkAuthAndRefreshToken, forgetPassword); // done
router.post(
  "/activate-forget-password",
  checkAuthAndRefreshToken,
  activateForgetPassword
); // done
router.delete("/delete-account", checkAuthAndRefreshToken, deleteAccount); // done

export default router;
