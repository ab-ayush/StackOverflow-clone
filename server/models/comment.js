import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    // null for a top-level comment; the id of a top-level comment for a reply
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment",
      default: null,
    },
    content: { type: String, required: true, maxlength: 1000 },
    replyCount: { type: Number, default: 0 },
    mentions: {
      type: [
        {
          _id: false,
          user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
          username: String,
        },
      ],
      default: [],
    },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, parent: 1, _id: -1 });
commentSchema.index({ parent: 1, _id: 1 });

export default mongoose.model("comment", commentSchema);
