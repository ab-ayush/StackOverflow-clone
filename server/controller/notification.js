import mongoose from "mongoose";
import Notification from "../models/notification.js";

const DEFAULT_PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 30;

// GET /notification?cursor=<lastNotificationId>
export const getNotifications = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { cursor } = req.query;

  const filter = { recipient: req.userId };
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }
    filter._id = { $lt: cursor };
  }

  try {
    const items = await Notification.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("actor", "name username")
      .populate("post", "content")
      .populate("comment", "content")
      .lean();

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    const data = page
      // hide notifications whose person or post no longer exists
      .filter((n) => n.actor && (n.type === "follow" || n.post))
      .map((n) => {
        const text = n.comment?.content ?? n.post?.content ?? "";
        return {
          _id: n._id,
          type: n.type,
          read: n.read,
          createdAt: n.createdAt,
          actor: n.actor,
          postId: n.post?._id ?? null,
          onComment: !!n.comment,
          preview: text ? text.slice(0, 80) : null,
        };
      });

    res.status(200).json({
      data,
      nextCursor: hasMore ? page[page.length - 1]._id : null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /notification/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.userId, read: false });
    res.status(200).json({ count });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// PATCH /notification/read/:id
export const markRead = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "notification unavailable" });
  }
  try {
    await Notification.updateOne({ _id: id, recipient: req.userId }, { $set: { read: true } });
    res.status(200).json({ message: "ok" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// PATCH /notification/read-all
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "ok" });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};