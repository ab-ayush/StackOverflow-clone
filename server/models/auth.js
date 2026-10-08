import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },
  lastPasswordResetRequest: { type: Date, default: null },
  isAdmin: { type: Boolean, default: false },
  reputation: { type: Number, default: 0 },
  profileCompletionBonusAwarded: { type: Boolean, default: false },
});
export default mongoose.model("user", userschema);