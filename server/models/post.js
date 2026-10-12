import mongoose from "mongoose";

const codeSnippetSchema = new mongoose.Schema(
  {
    language: { type: String, default: "text" },
    code: { type: String, required: true },
  },
  { _id: false }
);

const mentionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    username: String,
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    type: {
      type: String,
      enum: ["update", "snippet", "showcase", "achievement"],
      default: "update",
    },
    content: { type: String, required: true, maxlength: 2000 },
    codeSnippet: { type: codeSnippetSchema, default: null },
    images: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    mentions: { type: [mentionSchema], default: [] },
    likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }], default: [] },
    likeCount: { type: Number, default: 0 },
    sharedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }], default: [] },
    shareCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, _id: -1 });
postSchema.index({ hashtags: 1, _id: -1 });
postSchema.index({ createdAt: -1 });

export default mongoose.model("post", postSchema);