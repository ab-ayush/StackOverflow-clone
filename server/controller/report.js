import mongoose from "mongoose";
import Report from "../models/report.js";
import User from "../models/auth.js";
import { hasPrivilege } from "../utils/privileges.js";

export const submitReport = async (req, res) => {
  const { contentType, contentId, relatedQuestion, reason } = req.body;

  if (!["question", "answer"].includes(contentType)) {
    return res.status(400).json({ message: "Invalid content type" });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: "A reason is required" });
  }

  try {
    const reporter = await User.findById(req.userId);
    if (!reporter) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!hasPrivilege(reporter.reputation, "REPORT_CONTENT")) {
      return res.status(403).json({
        message: "You need at least 500 reputation to report content",
      });
    }

    const report = await Report.create({
      reportedBy: req.userId,
      contentType,
      contentId,
      relatedQuestion: relatedQuestion || null,
      reason,
    });

    res.status(200).json({ message: "Report submitted", data: report });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};