import crypto from "crypto";
import User from "../models/auth.js";
import LanguageChallenge from "../models/languageChallenge.js";
import { isSupportedLanguage, channelFor } from "../utils/languages.js";
import { otpMessage } from "../utils/otpMessages.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendSms } from "../utils/sendSms.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_SENDS_PER_USER_PER_HOUR = 5;
const MAX_SENDS_PER_PHONE_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

// every failure carries a machine-readable code, so the frontend can show the message
// in the user's own language
const fail = (res, status, code, message, extra = {}) =>
  res.status(status).json({ code, message, ...extra });

const hashCode = (userId, language, code) =>
  crypto
    .createHmac("sha256", process.env.OTP_SECRET || process.env.JWT_SECRET)
    .update(`${userId}:${language}:${code}`)
    .digest("hex");

const safeEqual = (a, b) => {
  const first = Buffer.from(a);
  const second = Buffer.from(b);
  return first.length === second.length && crypto.timingSafeEqual(first, second);
};

// "+91 98765-43210" -> "+919876543210", or null when it isn't a valid international number
const normalizePhone = (value) => {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\s\-().]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : null;
};

const maskEmail = (email = "") => {
  const [name, domain] = email.split("@");
  if (!domain) return "";
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
};

const maskPhone = (phone = "") =>
  `${phone.slice(0, 3)}${"*".repeat(Math.max(0, phone.length - 7))}${phone.slice(-4)}`;

// GET /language/status?language=fr
// what the dialog needs before it asks for a code, and the account's saved language
export const getLanguageStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("email phone preferredLanguage")
      .lean();
    if (!user) {
      return fail(res, 404, "USER_NOT_FOUND", "user not found");
    }
    const { language } = req.query;
    res.status(200).json({
      preferredLanguage: user.preferredLanguage || "en",
      channel: isSupportedLanguage(language) ? channelFor(language) : null,
      hasPhone: !!user.phone,
      maskedPhone: user.phone ? maskPhone(user.phone) : null,
      maskedEmail: maskEmail(user.email),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// POST /language/request-otp  { language, phone? }
export const requestLanguageOtp = async (req, res) => {
  const { language } = req.body;
  if (!isSupportedLanguage(language)) {
    return fail(res, 400, "UNSUPPORTED_LANGUAGE", "Unsupported language");
  }

  try {
    const user = await User.findById(req.userId).select("email phone preferredLanguage");
    if (!user) {
      return fail(res, 404, "USER_NOT_FOUND", "user not found");
    }
    if ((user.preferredLanguage || "en") === language) {
      return fail(res, 400, "SAME_LANGUAGE", "You're already using this language");
    }

    // where does the code go?
    const channel = channelFor(language);
    let destination;
    if (channel === "email") {
      destination = user.email;
    } else if (user.phone) {
      destination = user.phone; // the registered number always wins
    } else {
      if (!req.body.phone) {
        return fail(res, 400, "PHONE_REQUIRED", "Add your mobile number to receive a code", {
          needsPhone: true,
        });
      }
      destination = normalizePhone(req.body.phone);
      if (!destination) {
        return fail(
          res,
          400,
          "INVALID_PHONE",
          "Enter a valid mobile number with country code, e.g. +919876543210"
        );
      }
    }

    // rate limits
    const now = new Date();
    const existing = await LanguageChallenge.findOne({ user: user._id });
    if (existing && now - existing.lastSentAt < RESEND_COOLDOWN_MS) {
      return fail(res, 429, "COOLDOWN", "Please wait a moment before asking for another code", {
        retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - (now - existing.lastSentAt)) / 1000),
      });
    }
    const inWindow = existing && now - existing.windowStart < HOUR_MS;
    if (inWindow && existing.sendCount >= MAX_SENDS_PER_USER_PER_HOUR) {
      return fail(res, 429, "TOO_MANY_REQUESTS", "Too many code requests. Try again later");
    }
    if (channel === "sms") {
      const rows = await LanguageChallenge.aggregate([
        { $match: { phone: destination, windowStart: { $gte: new Date(now - HOUR_MS) } } },
        { $group: { _id: null, sends: { $sum: "$sendCount" } } },
      ]);
      if ((rows[0]?.sends ?? 0) >= MAX_SENDS_PER_PHONE_PER_HOUR) {
        return fail(res, 429, "PHONE_LIMIT", "Too many codes have been sent to this number");
      }
    }

    // make and store the code (hashed)
    const code = String(crypto.randomInt(100000, 1000000));
    await LanguageChallenge.updateOne(
      { user: user._id },
      {
        $set: {
          language,
          channel,
          phone: channel === "sms" ? destination : "",
          codeHash: hashCode(user._id, language, code),
          expiresAt: new Date(now.getTime() + OTP_TTL_MS),
          attempts: 0,
          lastSentAt: now,
          windowStart: inWindow ? existing.windowStart : now,
          sendCount: inWindow ? existing.sendCount + 1 : 1,
        },
      },
      { upsert: true }
    );

    // deliver it, in the language the user is switching to
    const message = otpMessage(language, code, OTP_TTL_MS / 60000);
    try {
      if (channel === "email") {
        await sendEmail(destination, message.subject, message.body);
      } else {
        await sendSms(destination, message.body);
      }
    } catch (sendError) {
      console.log("Could not deliver the language code:", sendError);
      await LanguageChallenge.updateOne({ user: user._id }, { $set: { codeHash: null } });
      return fail(res, 502, "SEND_FAILED", "We couldn't send the code. Please try again");
    }

    res.status(200).json({
      channel,
      destination: channel === "email" ? maskEmail(destination) : maskPhone(destination),
      expiresInSeconds: OTP_TTL_MS / 1000,
      resendAfterSeconds: RESEND_COOLDOWN_MS / 1000,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};

// POST /language/verify-otp  { language, code }
export const verifyLanguageOtp = async (req, res) => {
  const { language, code } = req.body;
  if (!isSupportedLanguage(language)) {
    return fail(res, 400, "UNSUPPORTED_LANGUAGE", "Unsupported language");
  }
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return fail(res, 400, "BAD_CODE_FORMAT", "Enter the 6-digit code");
  }

  try {
    // the attempt is counted first and atomically, so parallel guesses can't get extra tries
    const challenge = await LanguageChallenge.findOneAndUpdate(
      { user: req.userId, codeHash: { $ne: null }, attempts: { $lt: MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" }
    );
    if (!challenge) {
      return fail(res, 400, "NO_ACTIVE_CODE", "There is no active code. Please request a new one");
    }
    if (challenge.language !== language) {
      return fail(res, 400, "WRONG_LANGUAGE", "This code was requested for a different language");
    }
    if (challenge.expiresAt < new Date()) {
      await LanguageChallenge.updateOne({ user: req.userId }, { $set: { codeHash: null } });
      return fail(res, 400, "CODE_EXPIRED", "This code has expired. Please request a new one");
    }

    if (!safeEqual(hashCode(req.userId, language, code), challenge.codeHash)) {
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - challenge.attempts);
      if (attemptsLeft === 0) {
        await LanguageChallenge.updateOne({ user: req.userId }, { $set: { codeHash: null } });
        return fail(res, 400, "TOO_MANY_ATTEMPTS", "Too many wrong attempts", { attemptsLeft });
      }
      return fail(res, 400, "CODE_INCORRECT", "That code is incorrect", { attemptsLeft });
    }

    // correct: apply the language, and register the mobile number if this was its first use
    const user = await User.findById(req.userId).select("phone");
    const changes = { preferredLanguage: language };
    if (challenge.channel === "sms" && !user?.phone && challenge.phone) {
      changes.phone = challenge.phone;
    }
    await User.updateOne({ _id: req.userId }, { $set: changes });
    await LanguageChallenge.updateOne({ user: req.userId }, { $set: { codeHash: null } });

    res.status(200).json({ message: "Language updated", language });
  } catch (err) {
    console.log(err);
    res.status(500).json("something went wrong..");
  }
};