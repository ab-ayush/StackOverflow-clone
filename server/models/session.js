import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    refreshToken: { type: String, required: true, unique: true },
    deviceId: { type: String, required: true, index: true },   // ← already here
    browser: String,
    os: String,
    deviceType: { type: String, default: "unknown" },
    ip: String,
    location: { city: String, region: String, country: String },
    isTrusted: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sessionSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("Session", sessionSchema);