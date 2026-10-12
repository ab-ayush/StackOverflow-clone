import mongoose from "mongoose";
import Post from "../models/post.js";
import { decoratePosts } from "./post.js";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;
const TAG_RE = /^[a-z][a-z0-9_]{0,29}$/;

// GET /post/tag/:tag?cursor=<lastPostId>
export const getPostsByTag = async (req, res) => {
  const tag = String(req.params.tag || "").toLowerCase();
  if (!TAG_RE.test(tag)) {
    return res.status(400).json({ message: "Invalid hashtag" });
  }

  const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { cursor } = req.query;
  const filter = { hashtags: tag };
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }
    filter._id = { $lt: cursor };
  }

  try {
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

// the 7-day tag ranking barely changes, so it's recalculated at most every 2 minutes
const POPULAR_CACHE_MS = 2 * 60 * 1000;
let popularCache = { data: null, expires: 0 };

// GET /post/tags/popular — the most used hashtags over the last 7 days
export const getPopularTags = async (req, res) => {
  try {
    if (popularCache.data && Date.now() < popularCache.expires) {
      return res.status(200).json({ data: popularCache.data });
    }

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tags = await Post.aggregate([
      { $match: { createdAt: { $gte: since }, hashtags: { $exists: true, $ne: [] } } },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 10 },
    ]);

    const data = tags.map((t) => ({ tag: t._id, count: t.count }));
    popularCache = { data, expires: Date.now() + POPULAR_CACHE_MS };
    res.status(200).json({ data });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};