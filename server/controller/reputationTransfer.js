import mongoose from "mongoose";
import User from "../models/auth.js";
import ReputationTransfer from "../models/reputationTransfer.js";
import { applyReputation } from "../utils/reputation.js";

export const transferReputation = async (req, res) => {
  const { receiverId, amount, reason } = req.body;
  const senderId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return res.status(400).json({ message: "Invalid receiver" });
  }
  if (String(receiverId) === String(senderId)) {
    return res.status(400).json({ message: "Cannot transfer reputation to yourself" });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "A reason is required" });
  }
  const transferAmount = Number(amount);
  if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ message: "Invalid amount" });
  }
  if (transferAmount > 50) {
    return res.status(400).json({ message: "Cannot transfer more than 50 points per transaction" });
  }

  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    if (sender.reputation <= 50) {
      return res.status(403).json({
        message: "You need more than 50 reputation to transfer points",
      });
    }
    if (sender.reputation - transferAmount < 0) {
      return res.status(400).json({ message: "Insufficient reputation" });
    }

    // check today's total already sent
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todaysTransfers = await ReputationTransfer.find({
      sender: senderId,
      createdAt: { $gte: startOfDay },
    });
    const totalSentToday = todaysTransfers.reduce((sum, t) => sum + t.amount, 0);

    if (totalSentToday + transferAmount > 100) {
      return res.status(400).json({
        message: `Daily transfer limit exceeded. You've sent ${totalSentToday}/100 points today.`,
      });
    }

    // apply the transfer
    await applyReputation({
      userId: senderId,
      amount: -transferAmount,
      reason: "reputation_transfer_sent",
      relatedQuestion: null,
    });
    await applyReputation({
      userId: receiverId,
      amount: transferAmount,
      reason: "reputation_transfer_received",
      relatedQuestion: null,
    });

    const transfer = await ReputationTransfer.create({
      sender: senderId,
      receiver: receiverId,
      amount: transferAmount,
      reason,
    });

    res.status(200).json({ message: "Transfer successful", data: transfer });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getTransferHistory = async (req, res) => {
  try {
    const transfers = await ReputationTransfer.find({
      $or: [{ sender: req.userId }, { receiver: req.userId }],
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ data: transfers });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};