import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Post from "../models/post.js";
import Bookmark from "../models/bookmark.js";
import { UPLOAD_DIR } from "../middleware/uploadImages.js";
import Comment from "../models/comment.js";
import Follow from "../models/follow.js";
import { extractHashtags, resolveMentions } from "../utils/textParser.js";
import Notification from "../models/notification.js";
import {
  createNotifications,
  upsertNotification,
  removeNotification,
} from "../utils/notify.js";
import PostReport from "../models/postReport.js";
import User from "../models/auth.js";
import { PLANS, effectivePlanId } from "../config/plans.js";

const POST_TYPES = ["update", "snippet", "showcase", "achievement"];
const MAX_CONTENT = 2000;
const MAX_CODE = 5000;
const MAX_IMAGES = 4;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;
const IMAGE_URL_PREFIX = "/uploads/posts/";

// multipart fields arrive as strings; plain JSON requests arrive already parsed
const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// returns { snippet, error }
const parseSnippet = (codeSnippet) => {
  if (!codeSnippet || !String(codeSnippet.code || "").trim()) {
    return { snippet: null };
  }
  const code = String(codeSnippet.code);
  if (code.length > MAX_CODE) {
    return { error: `Code snippet cannot exceed ${MAX_CODE} characters` };
  }
  const language = String(codeSnippet.language || "text").trim().slice(0, 30) || "text";
  return { snippet: { language, code } };
};

const validatePostFields = (body) => {
  const text = typeof body.content === "string" ? body.content.trim() : "";
  if (!text) return { error: "Post content is required" };
  if (text.length > MAX_CONTENT) {
    return { error: `Post cannot exceed ${MAX_CONTENT} characters` };
  }
  if (body.type && !POST_TYPES.includes(body.type)) {
    return { error: "Invalid post type" };
  }
  const { snippet, error } = parseSnippet(parseJsonField(body.codeSnippet, null));
  if (error) return { error };
  return { text, type: body.type, snippet };
};

// delete files that were already saved for a request we are rejecting
const discardUploads = (files = []) => {
  files.forEach((f) => fs.promises.unlink(f.path).catch(() => {}));
};

// delete stored images by their saved "/uploads/posts/<name>" paths
const deleteImageFiles = (paths = []) => {
  paths.forEach((p) => {
    const file = path.join(UPLOAD_DIR, path.basename(p));
    fs.promises.unlink(file).catch(() => {});
  });
};
// deletes a post and everything that hangs off it
export const purgePost = async (post) => {
  await Post.deleteOne({ _id: post._id });
  await Bookmark.deleteMany({ post: post._id });
  await Comment.deleteMany({ post: post._id });
  await Notification.deleteMany({ post: post._id });
  await PostReport.deleteMany({ post: post._id });
  deleteImageFiles(post.images);
};

// Adds likedByMe / bookmarkedByMe for the current user and removes the raw lists of
// user ids, so clients only ever receive counts and their own flags.
export const decoratePosts = async (posts, userId) => {
  let likedSet = new Set();
  let bookmarkedSet = new Set();
  let followedAuthors = new Set();

  if (userId && posts.length > 0) {
    const ids = posts.map((p) => p._id);
    const authorIds = [
      ...new Set(posts.map((p) => p.author?._id).filter(Boolean).map(String)),
    ];
    const [liked, bookmarks, follows] = await Promise.all([
      Post.find({ _id: { $in: ids }, likes: userId }).select("_id").lean(),
      Bookmark.find({ user: userId, post: { $in: ids } }).select("post").lean(),
      Follow.find({ follower: userId, following: { $in: authorIds } })
        .select("following")
        .lean(),
    ]);
    likedSet = new Set(liked.map((p) => String(p._id)));
    bookmarkedSet = new Set(bookmarks.map((b) => String(b.post)));
    followedAuthors = new Set(follows.map((f) => String(f.following)));
  }

  return posts.map((p) => {
    const { likes, sharedBy, ...rest } = p;
    return {
      ...rest,
      likeCount: rest.likeCount ?? 0, // posts made before likes existed have no counter
      shareCount: rest.shareCount ?? 0,
      commentCount: rest.commentCount ?? 0,
      likedByMe: likedSet.has(String(p._id)),
      bookmarkedByMe: bookmarkedSet.has(String(p._id)),
      followingAuthor: followedAuthors.has(String(p.author?._id)),
    };
  });
};

export const createPost = async (req, res) => {
  const files = req.files || [];
  const { error, text, type, snippet } = validatePostFields(req.body);
  if (error) {
    discardUploads(files);
    return res.status(400).json({ message: error });
  }

  try {
    const mentions = await resolveMentions(text);
    const post = await Post.create({
      author: req.userId,
      type: type || "update",
      content: text,
      codeSnippet: snippet,
      images: files.map((f) => IMAGE_URL_PREFIX + f.filename),
      hashtags: extractHashtags(text),
      mentions,
    });

    await createNotifications(
      mentions.map((m) => ({
        recipient: m.user,
        actor: req.userId,
        type: "mention",
        post: post._id,
      }))
    );

    await post.populate("author", "name username");
    const [data] = await decoratePosts([post.toObject()], req.userId);
    res.status(200).json({ data });
  } catch (err) {
    discardUploads(files);
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /post/feed?cursor=<lastPostId>&limit=10&scope=following
export const getFeed = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { cursor, scope } = req.query;

  const filter = {};
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }
    filter._id = { $lt: cursor };
  }

  try {
    if (scope === "following") {
      if (!req.userId) {
        return res
          .status(401)
          .json({ message: "Log in to see posts from people you follow" });
      }
      const follows = await Follow.find({ follower: req.userId })
        .select("following")
        .lean();
      // people you follow, plus your own posts
      filter.author = { $in: [...follows.map((f) => f.following), req.userId] };
    }

    // fetch one extra to know whether another page exists
    const posts = await Post.find(filter)
      .select("-likes -sharedBy")
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("author", "name username")
      .lean();

    const hasMore = posts.length > limit;
    const page = hasMore ? posts.slice(0, limit) : posts;
    const data = await decoratePosts(page, req.userId);

    res.status(200).json({
      data,
      nextCursor: hasMore ? page[page.length - 1]._id : null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /post/:id  (used by share links)
export const getPost = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "post unavailable" });
  }

  try {
    const post = await Post.findById(id)
      .select("-likes -sharedBy")
      .populate("author", "name username")
      .lean();
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }
    const [data] = await decoratePosts([post], req.userId);
    res.status(200).json({ data });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

export const updatePost = async (req, res) => {
  const files = req.files || [];
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    discardUploads(files);
    return res.status(400).json({ message: "post unavailable" });
  }
  const { error, text, type, snippet } = validatePostFields(req.body);
  if (error) {
    discardUploads(files);
    return res.status(400).json({ message: error });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      discardUploads(files);
      return res.status(404).json({ message: "post not found" });
    }
    if (String(post.author) !== String(req.userId)) {
      discardUploads(files);
      return res.status(403).json({ message: "You can only edit your own posts" });
    }

    // images the client wants to keep; ignore anything that isn't already on this post
    const existing = post.images || [];
    const requestedKeep = parseJsonField(req.body.keepImages, existing);
    const keep = Array.isArray(requestedKeep)
      ? existing.filter((p) => requestedKeep.includes(p))
      : existing;
    const added = files.map((f) => IMAGE_URL_PREFIX + f.filename);

    if (keep.length + added.length > MAX_IMAGES) {
      discardUploads(files);
      return res.status(400).json({ message: `You can attach up to ${MAX_IMAGES} images` });
    }

    const removed = existing.filter((p) => !keep.includes(p));
    const previousMentions = new Set((post.mentions || []).map((m) => String(m.user)));
    const mentions = await resolveMentions(text);

    post.content = text;
    if (type) post.type = type;
    post.codeSnippet = snippet;
    post.images = [...keep, ...added];
    post.hashtags = extractHashtags(text);
    post.mentions = mentions;
    post.editedAt = new Date();
    await post.save();

    deleteImageFiles(removed);

    // only people newly mentioned by this edit get a notification
    await createNotifications(
      mentions
        .filter((m) => !previousMentions.has(String(m.user)))
        .map((m) => ({
          recipient: m.user,
          actor: req.userId,
          type: "mention",
          post: post._id,
        }))
    );

    await post.populate("author", "name username");
    const [data] = await decoratePosts([post.toObject()], req.userId);
    res.status(200).json({ data });
  } catch (err) {
    discardUploads(files);
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "post unavailable" });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }
    if (String(post.author) !== String(req.userId)) {
      return res.status(403).json({ message: "You can only delete your own posts" });
    }

    await purgePost(post);
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// PATCH /post/like/:id  — toggles. Each step is one atomic database operation, so
// two quick clicks can never leave likeCount out of sync with the likes list.
export const toggleLike = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  const userId = req.userId;

  try {
    let updated = await Post.findOneAndUpdate(
      { _id: id, likes: { $ne: userId } },
      { $addToSet: { likes: userId }, $inc: { likeCount: 1 } },
      { returnDocument: "after" }
    ).select("likeCount author");
    if (updated) {
      await upsertNotification({
        recipient: updated.author,
        actor: userId,
        type: "like",
        post: id,
      });
      return res.status(200).json({ liked: true, likeCount: updated.likeCount });
    }

    updated = await Post.findOneAndUpdate(
      { _id: id, likes: userId },
      { $pull: { likes: userId }, $inc: { likeCount: -1 } },
      { returnDocument: "after" }
    ).select("likeCount author");
    if (updated) {
      await removeNotification({
        recipient: updated.author,
        actor: userId,
        type: "like",
        post: id,
      });
      return res.status(200).json({ liked: false, likeCount: Math.max(0, updated.likeCount) });
    }

    res.status(404).json({ message: "post not found" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// PATCH /post/bookmark/:id  — toggles
export const toggleBookmark = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "post unavailable" });
  }

  try {
    const removed = await Bookmark.findOneAndDelete({ user: req.userId, post: id });
    if (removed) {
      return res.status(200).json({ bookmarked: false });
    }

    const exists = await Post.exists({ _id: id });
    if (!exists) {
      return res.status(404).json({ message: "post not found" });
    }

    // free and Bronze accounts can only keep a limited number of bookmarks
    const owner = await User.findById(req.userId).select("plan planExpiresAt");
    const limit = PLANS[effectivePlanId(owner)].bookmarkLimit; // null = unlimited
    if (limit !== null) {
      const saved = await Bookmark.countDocuments({ user: req.userId });
      if (saved >= limit) {
        return res.status(403).json({
          message: "Bookmark limit reached",
          code: "BOOKMARK_LIMIT",
          limit,
        });
      }
    }

    try {
      await Bookmark.create({ user: req.userId, post: id });
    } catch (err) {
      if (err.code !== 11000) throw err; // 11000 = already bookmarked by a parallel request
    }
    res.status(200).json({ bookmarked: true });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};
// POST /post/share/:id  — counts once per logged-in user
export const registerShare = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "post unavailable" });
  }

  try {
    const updated = await Post.findOneAndUpdate(
      { _id: id, sharedBy: { $ne: req.userId } },
      { $addToSet: { sharedBy: req.userId }, $inc: { shareCount: 1 } },
      { returnDocument: "after" }
    ).select("shareCount");
    if (updated) {
      return res.status(200).json({ shareCount: updated.shareCount });
    }

    // either already counted for this user, or the post doesn't exist
    const post = await Post.findById(id).select("shareCount").lean();
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }
    res.status(200).json({ shareCount: post.shareCount ?? 0 });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /post/bookmarks?cursor=<lastBookmarkId>
export const getBookmarkedPosts = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { cursor } = req.query;

  const filter = { user: req.userId };
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }
    filter._id = { $lt: cursor };
  }

  try {
    const marks = await Bookmark.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate({
        path: "post",
        select: "-likes -sharedBy",
        populate: { path: "author", select: "name username" },
      })
      .lean();

    const hasMore = marks.length > limit;
    const page = hasMore ? marks.slice(0, limit) : marks;
    const posts = page.map((m) => m.post).filter(Boolean); // skip posts that no longer exist
    const data = await decoratePosts(posts, req.userId);

    res.status(200).json({
      data,
      nextCursor: hasMore ? page[page.length - 1]._id : null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};