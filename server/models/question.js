import mongoose from "mongoose";

const questionschema = mongoose.Schema(
  {
    questiontitle: { type: String, required: true },
    questionbody: { type: String, required: true },
    questiontags: { type: [String], required: true },
    noofanswer: { type: Number, default: 0 },
    upvote: { type: [String], default: [] },
    downvote: { type: [String], default: [] },
    userposted: { type: String },
    userid: { type: String },
    askedon: { type: Date, default: Date.now },
    askerBonusAwarded: { type: Boolean, default: false },
    answer: [
      {
        answerbody: String,
        useranswered: String,
        userid: String,
        answeredon: { type: Date, default: Date.now },
        accepted: { type: Boolean, default: false },
        upvote: { type: [String], default: [] },
        downvote: { type: [String], default: [] },
        bonusAwarded: { type: Boolean, default: false },
      },
    ],
  },
  { timestamp: true }
);
export default mongoose.model("question", questionschema);