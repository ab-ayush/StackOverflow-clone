import mongoose from "mongoose";
import question from "../models/question.js";
import { applyReputation } from "../utils/reputation.js";
import User from "../models/auth.js";
import { PLANS, effectivePlanId } from "../config/plans.js";
import { startOfTodayIST, startOfTomorrowIST } from "../utils/usage.js";


export const Askquestion = async (req, res) => {
  const { postquestiondata } = req.body;
  try {
    const user = await User.findById(req.userId).select("name plan planExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    const planId = effectivePlanId(user);
    const limit = PLANS[planId].questionsPerDay; // null = unlimited
    if (limit !== null) {
      const used = await question.countDocuments({
        userid: String(req.userId),
        askedon: { $gte: startOfTodayIST() },
      });
      if (used >= limit) {
        return res.status(403).json({
          message: "Daily question limit reached",
          code: "QUESTION_LIMIT",
          limit,
          used,
          plan: planId,
          resetsAt: startOfTomorrowIST(),
        });
      }
    }

    // the author always comes from the logged-in user, never from the request body
    const postques = new question({
      questiontitle: postquestiondata?.questiontitle,
      questionbody: postquestiondata?.questionbody,
      questiontags: postquestiondata?.questiontags,
      userposted: user.name,
      userid: String(req.userId),
    });
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
// ---------- search ----------
const SEARCH_PAGE_SIZE = 10;
const MAX_CANDIDATES = 300;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// how well a question matches the typed words: title counts most, then tags, then the body
const relevanceOf = (doc, terms) =>
  terms.reduce((score, term) => {
    const word = term.toLowerCase();
    let next = score;
    if (doc.questiontitle.toLowerCase().includes(word)) next += 3;
    const tags = (doc.questiontags || []).map((tag) => tag.toLowerCase());
    if (tags.includes(word)) next += 2;
    else if (tags.some((tag) => tag.includes(word))) next += 1;
    if (doc.questionbody.toLowerCase().includes(word)) next += 1;
    return next;
  }, 0);

const byNewest = (a, b) => new Date(b.askedon) - new Date(a.askedon);

const SORTERS = {
  // plans with searchBoost (Gold) come first, then the better match, then the newer question
  relevance: (a, b) => b._boost - a._boost || b._score - a._score || byNewest(a, b),
  newest: byNewest,
  votes: (a, b) => b.votes - a.votes || byNewest(a, b),
  answers: (a, b) => b.noofanswer - a.noofanswer || byNewest(a, b),
};

export const searchQuestions = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const terms = q.split(/\s+/).filter(Boolean).slice(0, 6);

    // advanced filters
    const tag = String(req.query.tag || "").trim().toLowerCase().slice(0, 40);
    const author = String(req.query.author || "").trim().slice(0, 50);
    const answered = ["yes", "no"].includes(req.query.answered) ? req.query.answered : "";
    const rawMin = req.query.minVotes;
    const minVotes =
      rawMin !== undefined && rawMin !== "" && Number.isFinite(Number(rawMin))
        ? Math.max(0, Math.floor(Number(rawMin)))
        : null;
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    if (to) to.setHours(23, 59, 59, 999); // the whole last day counts
    const sort = ["newest", "votes", "answers"].includes(req.query.sort)
      ? req.query.sort
      : "relevance";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const usesAdvanced = !!(
      tag || author || answered || minVotes !== null || from || to || sort !== "relevance"
    );

    if (usesAdvanced) {
      const requester = req.userId
        ? await User.findById(req.userId).select("plan planExpiresAt")
        : null;
      if (!PLANS[effectivePlanId(requester)].advancedSearch) {
        return res.status(403).json({
          message: "Advanced search filters need a paid plan",
          code: "PLAN_REQUIRED",
          requiredPlan: "bronze",
        });
      }
    }

    if (!terms.length && !usesAdvanced) {
      return res
        .status(200)
        .json({ data: [], total: 0, page, pageSize: SEARCH_PAGE_SIZE });
    }

    const conditions = [];
    terms.forEach((term) => {
      const pattern = new RegExp(escapeRegex(term), "i");
      conditions.push({
        $or: [{ questiontitle: pattern }, { questionbody: pattern }, { questiontags: pattern }],
      });
    });
    if (tag) conditions.push({ questiontags: new RegExp(`^${escapeRegex(tag)}$`, "i") });
    if (author) conditions.push({ userposted: new RegExp(escapeRegex(author), "i") });
    if (answered === "yes") conditions.push({ noofanswer: { $gt: 0 } });
    if (answered === "no") conditions.push({ noofanswer: { $not: { $gt: 0 } } });
    if (from) conditions.push({ askedon: { $gte: from } });
    if (to) conditions.push({ askedon: { $lte: to } });
    if (minVotes !== null) {
      conditions.push({
        $expr: {
          $gte: [{ $subtract: [{ $size: "$upvote" }, { $size: "$downvote" }] }, minVotes],
        },
      });
    }

    const candidates = await question
      .find(conditions.length ? { $and: conditions } : {})
      .select(
        "questiontitle questionbody questiontags upvote downvote noofanswer userposted userid askedon answer.accepted"
      )
      .sort({ askedon: -1 })
      .limit(MAX_CANDIDATES)
      .lean();

    // the plan of every author decides the ranking boost and the badge
    const authorIds = [
      ...new Set(
        candidates.map((c) => c.userid).filter((id) => mongoose.Types.ObjectId.isValid(id))
      ),
    ];
    const authors = await User.find({ _id: { $in: authorIds } })
      .select("plan planExpiresAt")
      .lean();
    const planById = new Map(authors.map((a) => [String(a._id), effectivePlanId(a)]));

    const rows = candidates.map((c) => {
      const authorPlan = planById.get(String(c.userid)) || "free";
      return {
        _id: c._id,
        questiontitle: c.questiontitle,
        excerpt: (c.questionbody || "").slice(0, 240),
        questiontags: c.questiontags || [],
        votes: (c.upvote || []).length - (c.downvote || []).length,
        noofanswer: c.noofanswer || 0,
        hasAccepted: (c.answer || []).some((a) => a.accepted),
        userposted: c.userposted,
        userid: c.userid,
        askedon: c.askedon,
        authorPlan,
        _score: relevanceOf(c, terms),
        _boost: PLANS[authorPlan].searchBoost ? 1 : 0,
      };
    });

    rows.sort(SORTERS[sort]);

    const total = rows.length;
    const data = rows
      .slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE)
      .map(({ _score, _boost, ...rest }) => ({
        ...rest,
        boosted: sort === "relevance" && _boost === 1,
      }));

    res.status(200).json({ data, total, page, pageSize: SEARCH_PAGE_SIZE });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};