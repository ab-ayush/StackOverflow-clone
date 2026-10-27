import mongoose from "mongoose";
import LoungeMessage from "../models/loungeMessage.js";
import User from "../models/auth.js";

const PAGE_SIZE = 30;

const view = (message) => ({
  _id: message._id,
  content: message.content,
  createdAt: message.createdAt,
  author: message.user
    ? { _id: message.user._id, name: message.user.name, username: message.user.username }
    : null,
});

// newest page by default, older pages with ?before=<date of the oldest message you have>
export const getMessages = async (req, res) => {
  try {
    const filter = {};
    const before = req.query.before ? new Date(req.query.before) : null;
    if (before && !Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };

    const rows = await LoungeMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(PAGE_SIZE + 1)
      .populate("user", "name username")
      .lean();

    const hasMore = rows.length > PAGE_SIZE;
    const data = rows.slice(0, PAGE_SIZE).reverse().map(view); // oldest first, like a chat
    res.status(200).json({ data, hasMore });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const createMessage = async (req, res) => {
  const content = String(req.body?.content || "").trim().slice(0, 1000);
  if (!content) return res.status(400).json({ message: "Message cannot be empty" });

  try {
    const created = await LoungeMessage.create({ user: req.userId, content });
    const author = await User.findById(req.userId).select("name username").lean();
    res.status(201).json({ data: view({ ...created.toObject(), user: author }) });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Message not found" });
  }
  try {
    const message = await LoungeMessage.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (String(message.user) !== String(req.userId) && !req.isAdminUser) {
      return res.status(403).json({ message: "You can't delete this message" });
    }
    await message.deleteOne();
    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

// everyone whose Gold plan is active right now
export const getMembers = async (req, res) => {
  try {
    const members = await User.find({ plan: "gold", planExpiresAt: { $gt: new Date() } })
      .select("name username")
      .sort({ name: 1 })
      .limit(200)
      .lean();
    res.status(200).json({ data: members });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};