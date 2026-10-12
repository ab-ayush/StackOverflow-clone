import mongoose from "mongoose";
import Comment from "../models/comment.js";
import Post from "../models/post.js";
import { resolveMentions } from "../utils/textParser.js";
import Notification from "../models/notification.js";
import { createNotifications } from "../utils/notify.js";

const MAX_COMMENT = 1000;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 30;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const cleanContent = (value) => (typeof value === "string" ? value.trim() : "");
const pageSize = (req) =>
  Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

export const createComment = async (req, res) => {
  const { postId, parentId } = req.body;
  const text = cleanContent(req.body.content);

  if (!isValidId(postId)) {
    return res.status(400).json({ message: "post unavailable" });
  }
  if (!text) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  if (text.length > MAX_COMMENT) {
    return res.status(400).json({ message: `Comment cannot exceed ${MAX_COMMENT} characters` });
  }

  try {
    const post = await Post.findById(postId).select("author");
    if (!post) {
      return res.status(404).json({ message: "post not found" });
    }

    let parent = null;
    if (parentId) {
      if (!isValidId(parentId)) {
        return res.status(400).json({ message: "comment unavailable" });
      }
      parent = await Comment.findById(parentId).select("post parent author");
      if (!parent || String(parent.post) !== String(postId)) {
        return res.status(404).json({ message: "comment not found" });
      }
      if (parent.parent) {
        return res.status(400).json({ message: "You can only reply to top-level comments" });
      }
    }

    const mentions = await resolveMentions(text);
    const comment = await Comment.create({
      post: postId,
      author: req.userId,
      parent: parent ? parent._id : null,
      content: text,
      mentions,
    });

    await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
    if (parent) {
      await Comment.updateOne({ _id: parent._id }, { $inc: { replyCount: 1 } });
    }

    // a reply tells the comment's author, a comment tells the post's author,
    // then anyone mentioned (a person who is already covered isn't notified twice)
    await createNotifications([
      parent
        ? { recipient: parent.author, actor: req.userId, type: "reply", post: postId, comment: comment._id }
        : { recipient: post.author, actor: req.userId, type: "comment", post: postId, comment: comment._id },
      ...mentions.map((m) => ({
        recipient: m.user,
        actor: req.userId,
        type: "mention",
        post: postId,
        comment: comment._id,
      })),
    ]);

    await comment.populate("author", "name username");
    res.status(200).json({ data: comment });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /comment/post/:postId?cursor=<lastCommentId>  (top-level comments, newest first)
export const getComments = async (req, res) => {
  const { postId } = req.params;
  const { cursor } = req.query;
  if (!isValidId(postId)) {
    return res.status(400).json({ message: "post unavailable" });
  }

  const limit = pageSize(req);
  const filter = { post: postId, parent: null };
  if (cursor) {
    if (!isValidId(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }
    filter._id = { $lt: cursor };
  }

  try {
    const comments = await Comment.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("author", "name username")
      .lean();

    const hasMore = comments.length > limit;
    const page = hasMore ? comments.slice(0, limit) : comments;
    res.status(200).json({
      data: page,
      nextCursor: hasMore ? page[page.length - 1]._id : null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// GET /comment/replies/:commentId?cursor=<lastReplyId>  (oldest first, reads like a conversation)
export const getReplies = async (req, res) => {
  const { commentId } = req.params;
  const { cursor } = req.query;
  if (!isValidId(commentId)) {
    return res.status(400).json({ message: "comment unavailable" });
  }

  const limit = pageSize(req);
  const filter = { parent: commentId };
  if (cursor) {
    if (!isValidId(cursor)) {
      return res.status(400).json({ message: "Invalid cursor" });
    }
    filter._id = { $gt: cursor };
  }

  try {
    const replies = await Comment.find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .populate("author", "name username")
      .lean();

    const hasMore = replies.length > limit;
    const page = hasMore ? replies.slice(0, limit) : replies;
    res.status(200).json({
      data: page,
      nextCursor: hasMore ? page[page.length - 1]._id : null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

export const updateComment = async (req, res) => {
  const { id } = req.params;
  const text = cleanContent(req.body.content);

  if (!isValidId(id)) {
    return res.status(400).json({ message: "comment unavailable" });
  }
  if (!text) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  if (text.length > MAX_COMMENT) {
    return res.status(400).json({ message: `Comment cannot exceed ${MAX_COMMENT} characters` });
  }

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "comment not found" });
    }
    if (String(comment.author) !== String(req.userId)) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    const previousMentions = new Set((comment.mentions || []).map((m) => String(m.user)));
    const mentions = await resolveMentions(text);

    comment.content = text;
    comment.mentions = mentions;
    comment.editedAt = new Date();
    await comment.save();

    // only people newly mentioned by this edit get a notification
    await createNotifications(
      mentions
        .filter((m) => !previousMentions.has(String(m.user)))
        .map((m) => ({
          recipient: m.user,
          actor: req.userId,
          type: "mention",
          post: comment.post,
          comment: comment._id,
        }))
    );

    await comment.populate("author", "name username");
    res.status(200).json({ data: comment });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// The comment's author, or the author of the post it is on, can delete it.
// Deleting a top-level comment also deletes its replies.
export const deleteComment = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: "comment unavailable" });
  }

  try {
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "comment not found" });
    }

    const post = await Post.findById(comment.post).select("author");
    const isCommentAuthor = String(comment.author) === String(req.userId);
    const isPostAuthor = post && String(post.author) === String(req.userId);
    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "You can't delete this comment" });
    }

    const filter = comment.parent ? { _id: id } : { $or: [{ _id: id }, { parent: id }] };
    const doomed = await Comment.find(filter).select("_id").lean();
    const result = await Comment.deleteMany(filter);
    await Notification.deleteMany({ comment: { $in: doomed.map((c) => c._id) } });

    if (post) {
      await Post.updateOne(
        { _id: comment.post },
        { $inc: { commentCount: -result.deletedCount } }
      );
    }
    if (comment.parent) {
      await Comment.updateOne({ _id: comment.parent }, { $inc: { replyCount: -1 } });
    }

    res.status(200).json({ message: "Comment deleted", deletedCount: result.deletedCount });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};