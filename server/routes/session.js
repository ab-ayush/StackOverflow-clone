import express from "express";
import {
  getMySessions,
  revokeSession,
  revokeAllOtherSessions,
  getAllSessionsAdmin,
} from "../controller/session.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/mine", auth, getMySessions);
router.delete("/:sessionId", auth, revokeSession);
router.delete("/", auth, revokeAllOtherSessions);
router.get("/admin/all", auth, getAllSessionsAdmin);

export default router;