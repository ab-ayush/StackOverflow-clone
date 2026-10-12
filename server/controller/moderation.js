import mongoose from "mongoose";
import Post from "../models/post.js";
import User from "../models/auth.js";
import Session from "../models/session.js";
import PostReport, { REPORT_REASONS } from "../models/postReport.js";
import ModerationLog from "../models/moderationLog.js";
import { purgePost } from "./post.js";
import { applyReputation } from "../utils/reputation.js";

const MAX_REPORTS_PER_DAY = 20;
const MAX_DETAILS = 300;
const QUEUE_LIMIT = 50;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

// how many posts of each user an admin has removed
const removedCounts = async (userIds) => {
  if (userIds.length === 0) return new Map();
  const rows = await ModerationLog.aggregate([
    { $match: { action: "remove_post", targetUser: { $in: userIds } } },
    { $group: { _id: "$targetUser", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
};

// ---------- any logged-in user ----------

// POST /post/report/:id
export const reportPost = async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const details = clean(req.body.details, MAX_DETAILS);

  if (!isValidId(id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: "Choose a reason for your report" });
  }
  if (reason === "other" && !details) {
    return res.status(400).json({ message: "Please describe the problem" });
  }

  try {
    const post = await Post.findById(id).select("author");
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }
    if (String(post.author) === String(req.userId)) {
      return res.status(400).json({ message: "You can't report your own post" });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await PostReport.countDocuments({
      reporter: req.userId,
      createdAt: { $gte: since },
    });
    if (recent >= MAX_REPORTS_PER_DAY) {
      return res.status(429).json({ message: "You've reached today's report limit" });
    }

    try {
      await PostReport.create({ post: id, reporter: req.userId, reason, details });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: "You've already reported this post" });
      }
      throw err;
    }

    res.status(200).json({ message: "Thanks, our moderators will review this post" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// ---------- admins only (routes add auth + isAdmin) ----------

// GET /moderation/reports — reported posts, most reported first
export const getReportQueue = async (req, res) => {
  try {
    const groups = await PostReport.aggregate([
      { $match: { status: "pending" } },
      {
        $group: {
          _id: "$post",
          reportCount: { $sum: 1 },
          latest: { $max: "$createdAt" },
          reasons: { $push: "$reason" },
          notes: { $push: "$details" },
        },
      },
      { $sort: { reportCount: -1, latest: -1 } },
      { $limit: QUEUE_LIMIT },
    ]);

    const posts = await Post.find({ _id: { $in: groups.map((g) => g._id) } })
      .select("-likes -sharedBy")
      .populate("author", "name username suspendedAt isAdmin")
      .lean();
    const postById = new Map(posts.map((p) => [String(p._id), p]));
    const counts = await removedCounts(posts.map((p) => p.author?._id).filter(Boolean));

    const data = groups
      .filter((g) => postById.has(String(g._id)))
      .map((g) => {
        const post = postById.get(String(g._id));
        const reasonCounts = {};
        g.reasons.forEach((r) => {
          reasonCounts[r] = (reasonCounts[r] || 0) + 1;
        });
        return {
          postId: post._id,
          content: post.content.slice(0, 300),
          type: post.type,
          imageCount: (post.images || []).length,
          createdAt: post.createdAt,
          reportCount: g.reportCount,
          reasonCounts,
          notes: g.notes.filter(Boolean).slice(0, 3),
          author: post.author
            ? {
                _id: post.author._id,
                name: post.author.name,
                username: post.author.username,
                isAdmin: !!post.author.isAdmin,
                suspended: !!post.author.suspendedAt,
                removedPostCount: counts.get(String(post.author._id)) || 0,
              }
            : null,
        };
      });

    res.status(200).json({ data });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// PATCH /moderation/dismiss/:postId — the post is fine, close its reports
export const dismissReports = async (req, res) => {
  const { postId } = req.params;
  if (!isValidId(postId)) {
    return res.status(400).json({ message: "post unavailable" });
  }

  try {
    const post = await Post.findById(postId).select("author");
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    await PostReport.updateMany(
      { post: postId, status: "pending" },
      { $set: { status: "dismissed", reviewedBy: req.userId, reviewedAt: new Date() } }
    );
    await ModerationLog.create({
      admin: req.userId,
      targetUser: post.author,
      action: "dismiss_reports",
    });

    res.status(200).json({ message: "Reports dismissed" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// DELETE /moderation/post/:postId — remove a post for breaking the rules
export const removePost = async (req, res) => {
  const { postId } = req.params;
  const reason = clean(req.body?.reason, 200) || "Violates community guidelines";
  if (!isValidId(postId)) {
    return res.status(400).json({ message: "post unavailable" });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    await ModerationLog.create({
      admin: req.userId,
      targetUser: post.author,
      action: "remove_post",
      reason,
      postContent: post.content.slice(0, 300),
    });
    await purgePost(post);
    await applyReputation({
      userId: post.author,
      amount: -10,
      reason: "admin_removed_post",
    });

    const removedPostCount = await ModerationLog.countDocuments({
      targetUser: post.author,
      action: "remove_post",
    });

    res.status(200).json({
      message: "Post removed",
      authorId: String(post.author),
      removedPostCount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /moderation/suspended
export const getSuspendedUsers = async (req, res) => {
  try {
    const users = await User.find({ suspendedAt: { $ne: null } })
      .select("name username suspendedAt suspensionReason")
      .sort({ suspendedAt: -1 })
      .limit(100)
      .lean();
    const counts = await removedCounts(users.map((u) => u._id));

    res.status(200).json({
      data: users.map((u) => ({ ...u, removedPostCount: counts.get(String(u._id)) || 0 })),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// PATCH /moderation/suspend/:userId
export const suspendUser = async (req, res) => {
  const { userId } = req.params;
  const reason = clean(req.body?.reason, 200) || "Repeated guideline violations";
  if (!isValidId(userId)) {
    return res.status(400).json({ message: "user unavailable" });
  }
  if (String(userId) === String(req.userId)) {
    return res.status(400).json({ message: "You can't suspend yourself" });
  }

  try {
    const target = await User.findById(userId).select("isAdmin suspendedAt");
    if (!target) {
      return res.status(404).json({ message: "user not found" });
    }
    if (target.isAdmin) {
      return res.status(400).json({ message: "Admins can't be suspended" });
    }
    if (target.suspendedAt) {
      return res.status(400).json({ message: "This user is already suspended" });
    }

    await User.updateOne(
      { _id: userId },
      { $set: { suspendedAt: new Date(), suspensionReason: reason } }
    );
    // logs them out of every device
    await Session.deleteMany({ user: userId });
    await ModerationLog.create({
      admin: req.userId,
      targetUser: userId,
      action: "suspend",
      reason,
    });

    res.status(200).json({ message: "User suspended" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// PATCH /moderation/unsuspend/:userId
export const unsuspendUser = async (req, res) => {
  const { userId } = req.params;
  if (!isValidId(userId)) {
    return res.status(400).json({ message: "user unavailable" });
  }

  try {
    const result = await User.updateOne(
      { _id: userId, suspendedAt: { $ne: null } },
      { $set: { suspendedAt: null, suspensionReason: "" } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "This user isn't suspended" });
    }

    await ModerationLog.create({
      admin: req.userId,
      targetUser: userId,
      action: "unsuspend",
    });

    res.status(200).json({ message: "Suspension lifted" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};