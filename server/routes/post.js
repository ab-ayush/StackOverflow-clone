import express from "express";
import {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  registerShare,
  getBookmarkedPosts,
} from "../controller/post.js";
import { getPostsByTag, getPopularTags } from "../controller/tag.js";
import { getTrendingPosts } from "../controller/trending.js";
import { reportPost } from "../controller/moderation.js";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import { uploadPostImages } from "../middleware/uploadImages.js";

const router = express.Router();

router.get("/feed", optionalAuth, getFeed);
router.get("/bookmarks", auth, getBookmarkedPosts);
router.get("/tag/:tag", optionalAuth, getPostsByTag);
router.get("/tags/popular", getPopularTags);
router.get("/trending", optionalAuth, getTrendingPosts);
router.post("/create", auth, uploadPostImages, createPost);
router.patch("/update/:id", auth, uploadPostImages, updatePost);
router.delete("/delete/:id", auth, deletePost);
router.patch("/like/:id", auth, toggleLike);
router.patch("/bookmark/:id", auth, toggleBookmark);
router.post("/share/:id", auth, registerShare);
router.post("/report/:id", auth, reportPost);
// keep this last, otherwise it would swallow the single-segment routes above
router.get("/:id", optionalAuth, getPost);

export default router;