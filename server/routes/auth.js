import express from "express";
import {
  Signup,
  Login,
  VerifyDeviceOtp,
  RefreshAccessToken,
  getallusers,
  updateprofile,
  ForgotPassword,
  ChangePassword,
} from "../controller/auth.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/signup", Signup);
router.post("/login", Login);
router.post("/verify-device-otp", VerifyDeviceOtp);
router.post("/refresh", RefreshAccessToken);
router.get("/getalluser", getallusers);
router.patch("/update/:id", auth, updateprofile);
router.post("/forgot-password", ForgotPassword);
router.patch("/change-password", auth, ChangePassword);
export default router;
