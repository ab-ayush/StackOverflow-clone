import mongoose from "mongoose";

const reputationLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  amount: { type: Number, required: true }, // positive or negative
  reason: { type: String, required: true }, // e.g. "answer_posted", "answer_accepted"
  relatedQuestion: { type: mongoose.Schema.Types.ObjectId, ref: "question" },
  relatedAnswerId: { type: String }, // answer is a subdocument, not its own model — store its _id as string
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("reputationLog", reputationLogSchema);