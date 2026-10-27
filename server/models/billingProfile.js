import mongoose from "mongoose";

const billingProfileSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    fullName: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: "India" },
    gstin: { type: String, trim: true, uppercase: true },
  },
  { timestamps: true }
);

export default mongoose.model("billingProfile", billingProfileSchema);