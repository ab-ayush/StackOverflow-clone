import User from "../models/auth.js";

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const normalizeUsername = (value) =>
  String(value || "").trim().toLowerCase().replace(/^@/, "");

// Builds a free username from a display name: "Ayush Bisht" -> "ayush_bisht"
export const generateUniqueUsername = async (name) => {
  let base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 15);
  if (base.length < 3) base = `${base}user`.slice(0, 15);

  if (!(await User.exists({ username: base }))) return base;

  for (let i = 0; i < 20; i++) {
    const candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await User.exists({ username: candidate }))) return candidate;
  }
  return `user${Date.now().toString(36)}`;
};