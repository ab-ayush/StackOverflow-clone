import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    following: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// you can follow a person only once, enforced by the database
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ following: 1, _id: -1 });

export default mongoose.model("follow", followSchema);