import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, lowercase: true, trim: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },
  lastPasswordResetRequest: { type: Date, default: null },
  isAdmin: { type: Boolean, default: false },
  suspendedAt: { type: Date, default: null },
  suspensionReason: { type: String, default: "" },
  preferredLanguage: {
    type: String,
    enum: ["en", "es", "hi", "pt", "zh", "fr"],
    default: "en",
  },
  phone: { type: String, default: "" },
  reputation: { type: Number, default: 0 },
  profileCompletionBonusAwarded: { type: Boolean, default: false },
});

// usernames are unique, but users that don't have one yet don't collide with each other
userschema.index(
  { username: 1 },
  { unique: true, partialFilterExpression: { username: { $type: "string" } } }
);

export default mongoose.model("user", userschema);