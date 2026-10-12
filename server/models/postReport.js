import mongoose from "mongoose";

export const REPORT_REASONS = ["spam", "harassment", "inappropriate", "misinformation", "other"];

const postReportSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "post", required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: "", maxlength: 300 },
    status: { type: String, enum: ["pending", "dismissed"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// one report per person per post, enforced by the database
postReportSchema.index({ post: 1, reporter: 1 }, { unique: true });
postReportSchema.index({ status: 1, post: 1 });
postReportSchema.index({ reporter: 1, createdAt: -1 });

export default mongoose.model("postReport", postReportSchema);