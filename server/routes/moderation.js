import express from "express";
import {
  getReportQueue,
  dismissReports,
  removePost,
  getSuspendedUsers,
  suspendUser,
  unsuspendUser,
} from "../controller/moderation.js";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";

const router = express.Router();

router.get("/reports", auth, isAdmin, getReportQueue);
router.patch("/dismiss/:postId", auth, isAdmin, dismissReports);
router.delete("/post/:postId", auth, isAdmin, removePost);
router.get("/suspended", auth, isAdmin, getSuspendedUsers);
router.patch("/suspend/:userId", auth, isAdmin, suspendUser);
router.patch("/unsuspend/:userId", auth, isAdmin, unsuspendUser);

export default router;