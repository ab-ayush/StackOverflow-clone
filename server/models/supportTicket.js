import mongoose from "mongoose";

const supportTicketSchema = mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    // the plan the user had when they sent the ticket
    plan: { type: String, enum: ["free", "bronze", "silver", "gold"], default: "free" },
    priority: { type: Number, default: 0 }, // 0 standard, 1 priority, 2 top priority
    status: { type: String, enum: ["open", "closed"], default: "open" },
    adminReply: { type: String, default: "" },
    repliedAt: { type: Date, default: null },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
  },
  { timestamps: true }
);

// the admin inbox: open tickets, highest priority first, oldest first within a priority
supportTicketSchema.index({ status: 1, priority: -1, createdAt: 1 });

export default mongoose.model("supportTicket", supportTicketSchema);