import express from "express";
import {
  getLanguageStatus,
  requestLanguageOtp,
  verifyLanguageOtp,
} from "../controller/language.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/status", auth, getLanguageStatus);
router.post("/request-otp", auth, requestLanguageOtp);
router.post("/verify-otp", auth, verifyLanguageOtp);

export default router;