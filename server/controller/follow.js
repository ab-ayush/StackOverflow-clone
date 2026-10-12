import mongoose from "mongoose";
import Follow from "../models/follow.js";
import User from "../models/auth.js";
import { upsertNotification, removeNotification } from "../utils/notify.js";

// PATCH /follow/toggle/:userId
export const toggleFollow = async (req, res) => {
  const { userId: targetId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(targetId)) {
    return res.status(400).json({ message: "user unavailable" });
  }
  if (String(targetId) === String(req.userId)) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  try {
    const targetExists = await User.exists({ _id: targetId });
    if (!targetExists) {
      return res.status(404).json({ message: "user not found" });
    }

    const removed = await Follow.findOneAndDelete({
      follower: req.userId,
      following: targetId,
    });

    let following = false;
    if (!removed) {
      try {
        await Follow.create({ follower: req.userId, following: targetId });
      } catch (err) {
        if (err.code !== 11000) throw err; // 11000 = a parallel request already followed
      }
      following = true;
      await upsertNotification({ recipient: targetId, actor: req.userId, type: "follow" });
    } else {
      await removeNotification({ recipient: targetId, actor: req.userId, type: "follow" });
    }

    const followerCount = await Follow.countDocuments({ following: targetId });
    res.status(200).json({ following, followerCount });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /follow/stats/:userId
export const getFollowStats = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "user unavailable" });
  }

  try {
    const [followerCount, followingCount, mine] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
      req.userId
        ? Follow.exists({ follower: req.userId, following: userId })
        : Promise.resolve(null),
    ]);
    res.status(200).json({ followerCount, followingCount, isFollowing: !!mine });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};