import User from "../models/auth.js";

const MAX_HASHTAGS = 10;
const MAX_MENTIONS = 10;

// a # or @ only counts at the start of the text or after a space/punctuation
const BOUNDARY = "(?:^|[^A-Za-z0-9_&@#])";
const HASHTAG_RE = new RegExp(
  `${BOUNDARY}#([A-Za-z][A-Za-z0-9_]{0,29})(?![A-Za-z0-9_])`,
  "g"
);
const MENTION_RE = new RegExp(
  `${BOUNDARY}@([A-Za-z0-9_]{3,20})(?![A-Za-z0-9_])`,
  "g"
);

const collect = (text, re, limit) => {
  const found = new Set();
  for (const match of String(text || "").matchAll(re)) {
    found.add(match[1].toLowerCase());
    if (found.size >= limit) break;
  }
  return [...found];
};

export const extractHashtags = (text) => collect(text, HASHTAG_RE, MAX_HASHTAGS);

// returns [{ user, username }] for the mentioned usernames that actually exist
export const resolveMentions = async (text) => {
  const names = collect(text, MENTION_RE, MAX_MENTIONS);
  if (names.length === 0) return [];
  const users = await User.find({ username: { $in: names } })
    .select("_id username")
    .lean();
  return users.map((u) => ({ user: u._id, username: u.username }));
};