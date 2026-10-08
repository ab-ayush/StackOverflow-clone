import mongoose from "mongoose";
import ReputationLog from "../models/reputationLog.js";

export const getReputationLog = async (req, res) => {
  const { id: userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user" });
  }
  try {
    const logs = await ReputationLog.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ data: logs });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};