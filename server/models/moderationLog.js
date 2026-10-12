import mongoose from "mongoose";

const moderationLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    action: {
      type: String,
      enum: ["remove_post", "dismiss_reports", "suspend", "unsuspend"],
      required: true,
    },
    reason: { type: String, default: "" },
    // the post text is kept here because the post itself is deleted on removal
    postContent: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

moderationLogSchema.index({ targetUser: 1, action: 1 });

export default mongoose.model("moderationLog", moderationLogSchema);