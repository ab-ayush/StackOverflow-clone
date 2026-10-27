import mongoose from "mongoose";

const loungeMessageSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

loungeMessageSchema.index({ createdAt: -1 });

export default mongoose.model("loungeMessage", loungeMessageSchema);