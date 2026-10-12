import express from "express";
import { toggleFollow, getFollowStats } from "../controller/follow.js";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";

const router = express.Router();

router.get("/stats/:userId", optionalAuth, getFollowStats);
router.patch("/toggle/:userId", auth, toggleFollow);

export default router;