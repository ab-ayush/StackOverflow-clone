import Post from "../models/post.js";
import { decoratePosts } from "./post.js";

const WINDOW_DAYS = 7;
const MAX_RESULTS = 20;

// how much each kind of engagement is worth
const LIKE_WEIGHT = 1;
const COMMENT_WEIGHT = 2;
const SHARE_WEIGHT = 3;
// higher = older posts fall off faster
const GRAVITY = 1.5;

// The ranking (just the ordered post ids) is recalculated at most once per interval.
// The posts themselves are read fresh on every request, so counts are never stale.
// Set to 0 while testing if you want rank changes to show up immediately.
const RANKING_CACHE_MS = 60 * 1000;

let cachedIds = null;
let cacheExpires = 0;
let inFlight = null; // lets simultaneous visitors share one calculation

const computeRankedIds = async () => {
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const ranked = await Post.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $project: { createdAt: 1, likeCount: 1, commentCount: 1, shareCount: 1 } },
    {
      $addFields: {
        engagement: {
          $add: [
            { $multiply: [{ $ifNull: ["$likeCount", 0] }, LIKE_WEIGHT] },
            { $multiply: [{ $ifNull: ["$commentCount", 0] }, COMMENT_WEIGHT] },
            { $multiply: [{ $ifNull: ["$shareCount", 0] }, SHARE_WEIGHT] },
          ],
        },
        ageHours: { $divide: [{ $subtract: [now, "$createdAt"] }, 3600000] },
      },
    },
    { $match: { engagement: { $gt: 0 } } },
    {
      $addFields: {
        trendScore: {
          $divide: ["$engagement", { $pow: [{ $add: ["$ageHours", 2] }, GRAVITY] }],
        },
      },
    },
    { $sort: { trendScore: -1, _id: -1 } },
    { $limit: MAX_RESULTS },
    { $project: { _id: 1 } },
  ]);

  return ranked.map((r) => r._id);
};

const getRankedIds = async () => {
  if (cachedIds && Date.now() < cacheExpires) return cachedIds;

  if (!inFlight) {
    inFlight = computeRankedIds()
      .then((ids) => {
        cachedIds = ids;
        cacheExpires = Date.now() + RANKING_CACHE_MS;
        return ids;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

// GET /post/trending
export const getTrendingPosts = async (req, res) => {
  try {
    const ids = await getRankedIds();
    if (ids.length === 0) {
      return res.status(200).json({ data: [], nextCursor: null });
    }

    const docs = await Post.find({ _id: { $in: ids } })
      .select("-likes -sharedBy")
      .populate("author", "name username")
      .lean();

    // keep the cached order; skip posts deleted since the ranking was calculated
    const byId = new Map(docs.map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean);

    const data = await decoratePosts(ordered, req.userId);
    res.status(200).json({ data, nextCursor: null });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};