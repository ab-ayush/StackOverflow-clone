import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  contentType: { type: String, enum: ["question", "answer"], required: true },
  contentId: { type: String, required: true }, // question _id, or answer subdocument _id
  relatedQuestion: { type: mongoose.Schema.Types.ObjectId, ref: "question" }, // for answers, the parent question
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("report", reportSchema);