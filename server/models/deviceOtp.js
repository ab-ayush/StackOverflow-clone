import mongoose from "mongoose";

const deviceOtpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deviceId: { type: String, required: true },
  otp: { type: String, required: true },
  deviceInfo: {
    browser: String,
    os: String,
    deviceType: String,
    ip: String,
  },
  expiresAt: { type: Date, required: true },
});

deviceOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("DeviceOtp", deviceOtpSchema);