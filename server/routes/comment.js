import express from "express";
import {
  createComment,
  getComments,
  getReplies,
  updateComment,
  deleteComment,
} from "../controller/comment.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/post/:postId", getComments);
router.get("/replies/:commentId", getReplies);
router.post("/create", auth, createComment);
router.patch("/update/:id", auth, updateComment);
router.delete("/delete/:id", auth, deleteComment);

export default router;