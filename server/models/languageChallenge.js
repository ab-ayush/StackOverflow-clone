import mongoose from "mongoose";

const languageChallengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    unique: true,
  },
  language: { type: String, required: true },
  channel: { type: String, enum: ["email", "sms"], required: true },
  // the number the code was texted to (registered on the account once verified)
  phone: { type: String, default: "" },
  // keyed hash of the code, never the code itself. null once used up or invalidated
  codeHash: { type: String, default: null },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, required: true },
  sendCount: { type: Number, default: 1 },
  windowStart: { type: Date, default: Date.now },
});

// the record (and its send counters) is removed an hour after the window started
languageChallengeSchema.index({ windowStart: 1 }, { expireAfterSeconds: 60 * 60 });
languageChallengeSchema.index({ phone: 1, windowStart: 1 });

export default mongoose.model("languageChallenge", languageChallengeSchema);