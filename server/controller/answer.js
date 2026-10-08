import mongoose from "mongoose";
import question from "../models/question.js";
import { applyReputation } from "../utils/reputation.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { noofanswer, answerbody, useranswered, userid } = req.body;
  updatenoofanswer(_id, noofanswer);

  try {
    const updatequestion = await question.findByIdAndUpdate(
      _id,
      {
        $addToSet: { answer: [{ answerbody, useranswered, userid }] },
      },
      { new: true }
    );

    // find the answer we just added (last one matching this user, most recently pushed)
    const newAnswer = updatequestion.answer[updatequestion.answer.length - 1];

    await applyReputation({
      userId: userid,
      amount: 5,
      reason: "answer_posted",
      relatedQuestion: _id,
      relatedAnswerId: newAnswer?._id,
    });

    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

const updatenoofanswer = async (_id, noofanswer) => {
  try {
    await question.findByIdAndUpdate(_id, { $set: { noofanswer: noofanswer } });
  } catch (error) {
    console.log(error);
  }
};

export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { noofanswer, answerid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  updatenoofanswer(_id, noofanswer);

  try {
    // find the answer BEFORE deleting it, so we know whose reputation to deduct
    const questionDoc = await question.findById(_id);
    const answerToDelete = questionDoc?.answer.id(answerid);

    const updatequestion = await question.updateOne(
      { _id },
      {
        $pull: { answer: { _id: answerid } },
      }
    );

    if (answerToDelete) {
      await applyReputation({
        userId: answerToDelete.userid,
        amount: -5,
        reason: "answer_deleted",
        relatedQuestion: _id,
        relatedAnswerId: answerid,
      });
    }

    res.status(200).json({ data: updatequestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const acceptAnswer = async (req, res) => {
  const { id: questionId } = req.params;
  const { answerid, userid } = req.body; // userid = the person clicking accept (must own the question)

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }

  try {
    const questionDoc = await question.findById(questionId);
    if (!questionDoc) {
      return res.status(404).json({ message: "question not found" });
    }
    if (String(questionDoc.userid) !== String(userid)) {
      return res.status(403).json({ message: "Only the question owner can accept an answer" });
    }

    const targetAnswer = questionDoc.answer.id(answerid);
    if (!targetAnswer) {
      return res.status(404).json({ message: "answer not found" });
    }

    // track the currently-accepted answer (if any, and if it's a different one)
    const previouslyAccepted = questionDoc.answer.find(
      (a) => a.accepted && a._id.toString() !== answerid
    );
    const wasTargetAccepted = targetAnswer.accepted;

    // unaccept everything, then toggle the target
    questionDoc.answer.forEach((ans) => {
      ans.accepted = false;
    });
    targetAnswer.accepted = !wasTargetAccepted;

    await questionDoc.save();

    // if a different answer was accepted before, revoke its reputation
    if (previouslyAccepted) {
      await applyReputation({
        userId: previouslyAccepted.userid,
        amount: -10,
        reason: "answer_accept_revoked",
        relatedQuestion: questionId,
        relatedAnswerId: previouslyAccepted._id,
      });
    }

    // award or revoke reputation for the target answer based on the toggle
    await applyReputation({
      userId: targetAnswer.userid,
      amount: wasTargetAccepted ? -10 : 10,
      reason: wasTargetAccepted ? "answer_accept_revoked" : "answer_accepted",
      relatedQuestion: questionId,
      relatedAnswerId: answerid,
    });

    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const voteAnswer = async (req, res) => {
  const { id: questionId } = req.params;
  const { answerid, value, userid } = req.body;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }

  try {
    const questionDoc = await question.findById(questionId);
    const targetAnswer = questionDoc.answer.id(answerid);
    if (!targetAnswer) {
      return res.status(404).json({ message: "answer not found" });
    }

    const wasBonusAwarded = targetAnswer.bonusAwarded;

    const upindex = targetAnswer.upvote.findIndex((id) => id === String(userid));
    const downindex = targetAnswer.downvote.findIndex((id) => id === String(userid));

    if (value === "upvote") {
      if (downindex !== -1) {
        targetAnswer.downvote = targetAnswer.downvote.filter((id) => id !== String(userid));
      }
      if (upindex === -1) {
        targetAnswer.upvote.push(userid);
      } else {
        targetAnswer.upvote = targetAnswer.upvote.filter((id) => id !== String(userid));
      }
    } else if (value === "downvote") {
      if (upindex !== -1) {
        targetAnswer.upvote = targetAnswer.upvote.filter((id) => id !== String(userid));
      }
      if (downindex === -1) {
        targetAnswer.downvote.push(userid);
      } else {
        targetAnswer.downvote = targetAnswer.downvote.filter((id) => id !== String(userid));
      }
    }

    if (!wasBonusAwarded && targetAnswer.upvote.length >= 5) {
      targetAnswer.bonusAwarded = true;
    }

    await questionDoc.save();

    if (!wasBonusAwarded && targetAnswer.bonusAwarded) {
      await applyReputation({
        userId: targetAnswer.userid,
        amount: 5,
        reason: "answer_5_upvotes",
        relatedQuestion: questionId,
        relatedAnswerId: answerid,
      });
    }

    res.status(200).json({ data: questionDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const adminDeleteAnswer = async (req, res) => {
  const { id: questionId } = req.params;
  const { answerid } = req.body;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }

  try {
    const questionDoc = await question.findById(questionId);
    const answerToDelete = questionDoc?.answer.id(answerid);
    if (!answerToDelete) {
      return res.status(404).json({ message: "answer not found" });
    }

    const authorId = answerToDelete.userid;

    await question.updateOne({ _id: questionId }, { $pull: { answer: { _id: answerid } } });

    await applyReputation({
      userId: authorId,
      amount: -10,
      reason: "admin_removed_answer",
      relatedQuestion: questionId,
      relatedAnswerId: answerid,
    });

    res.status(200).json({ message: "answer removed by admin" });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};