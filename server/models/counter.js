import mongoose from "mongoose";

const counterSchema = mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

export default mongoose.model("counter", counterSchema);