import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    plan: { type: String, enum: ["bronze", "silver", "gold"], required: true },
    amount: { type: Number, required: true }, // in paise, as Razorpay expects
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    receipt: { type: String },
    paidAt: { type: Date, default: null },
    periodStart: { type: Date, default: null },
    periodEnd: { type: Date, default: null },
    // used by the invoice step (Day 2)
    invoiceNumber: { type: String, unique: true, sparse: true },
    billingSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    invoiceEmailedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("payment", paymentSchema);