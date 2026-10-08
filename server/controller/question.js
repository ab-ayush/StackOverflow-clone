import mongoose from "mongoose";
import question from "../models/question.js";
import { applyReputation } from "../utils/reputation.js";


export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;
  const postques = new question({ ...postquestiondata });
  try {
    await postques.save();
    res.status(200).json({ data: postques });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const getallquestion = async (req, res) => {
  try {
    const allquestion = await question.find().sort({ askedon: -1 });
    res.status(200).json({ data: allquestion });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const deletequestion = async (req, res) => {
  const { id: _id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    await question.findByIdAndDelete(_id);
    res.status(200).json({ message: "question deleted" });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const votequestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value, userid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    const wasAskerBonusAwarded = questionDoc.askerBonusAwarded; // snapshot BEFORE mutation

    const upindex = questionDoc.upvote.findIndex((id) => id === String(userid));
    const downindex = questionDoc.downvote.findIndex((id) => id === String(userid));

    let downvoteDelta = 0;

    if (value === "upvote") {
      if (downindex !== -1) {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(userid));
        downvoteDelta = 1;
      }
      if (upindex === -1) {
        questionDoc.upvote.push(userid);
      } else {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        questionDoc.upvote = questionDoc.upvote.filter((id) => id !== String(userid));
      }
      if (downindex === -1) {
        questionDoc.downvote.push(userid);
        downvoteDelta = -1;
      } else {
        questionDoc.downvote = questionDoc.downvote.filter((id) => id !== String(userid));
        downvoteDelta = 1;
      }
    }

    if (!wasAskerBonusAwarded && questionDoc.upvote.length >= 10) {
      questionDoc.askerBonusAwarded = true;
    }

    const questionvote = await question.findByIdAndUpdate(_id, questionDoc, { new: true });

    if (downvoteDelta !== 0) {
      await applyReputation({
        userId: questionDoc.userid,
        amount: downvoteDelta * 2,
        reason: downvoteDelta < 0 ? "question_downvoted" : "question_downvote_removed",
        relatedQuestion: _id,
      });
    }
    if (!wasAskerBonusAwarded && questionDoc.askerBonusAwarded) {
      await applyReputation({
        userId: questionDoc.userid,
        amount: 2,
        reason: "question_10_upvotes",
        relatedQuestion: _id,
      });
    }

    res.status(200).json({ data: questionvote });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};
export const adminDeleteQuestion = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  try {
    const questionDoc = await question.findById(_id);
    if (!questionDoc) {
      return res.status(404).json({ message: "question not found" });
    }

    await question.findByIdAndDelete(_id);

    await applyReputation({
      userId: questionDoc.userid,
      amount: -10,
      reason: "admin_removed_question",
      relatedQuestion: _id,
    });

    res.status(200).json({ message: "question removed by admin" });
  } catch (error) {
    res.status(500).json("something went wrong..");
    return;
  }
};