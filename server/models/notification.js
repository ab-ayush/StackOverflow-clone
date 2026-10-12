import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    type: {
      type: String,
      enum: ["like", "comment", "reply", "mention", "follow"],
      required: true,
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post", default: null },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: "comment", default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ recipient: 1, _id: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
// old notifications clean themselves up after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
notificationSchema.index({ post: 1 });
notificationSchema.index({ comment: 1 });

export default mongoose.model("notification", notificationSchema);