import { DEFAULT_LANGUAGE, isLanguageCode, languageFromCookieString } from "./config";
import type { LanguageCode } from "./config";
import { translate } from "./translate";
import type { TranslationKey, TranslationVars } from "./translate";

const currentLanguage = (): LanguageCode =>
  typeof document !== "undefined"
    ? languageFromCookieString(document.cookie)
    : DEFAULT_LANGUAGE;

// for code that isn't a component (toasts inside contexts and hooks)
export const tr = (key: TranslationKey, vars?: TranslationVars) =>
  translate(currentLanguage(), key, vars);

// same, but in a specific language (used right after login, before the cookie catches up)
export const trFor = (language: unknown, key: TranslationKey, vars?: TranslationVars) =>
  translate(isLanguageCode(language) ? language : currentLanguage(), key, vars);

// The server answers in English. Known messages are mapped to a translation key;
// anything unknown falls back to a generic message in the user's language.
const SERVER_MESSAGE_KEYS: Record<string, TranslationKey> = {
  "User does not exist": "server.userNotFound",
  "Invalid password": "server.invalidPassword",
  "User already exist": "server.userExists",
  "Invalid or expired OTP": "server.invalidOtp",
  "You can use this option only one time per day.": "server.resetOncePerDay",
  "New password sent to your email": "server.newPasswordSent",
  "Old password is incorrect": "server.oldPasswordIncorrect",
  "Password changed successfully": "server.passwordChanged",
  "Your account has been suspended": "server.accountSuspended",
  "Session expired, please log in again": "server.sessionExpired",
    "You need at least 500 reputation to report content": "question.reportNeedsReputation",
  "Only the question owner can accept an answer": "question.acceptOwnerOnly",
    "That username is already taken": "profile.usernameTaken",
  "Username must be 3-20 characters: letters, numbers or underscores": "profile.usernameInvalid",
  "You can only edit your own profile": "profile.editOwnOnly",
    "Post content is required": "server.postContentRequired",
  "Post cannot exceed 2000 characters": "server.postTooLong",
  "Invalid post type": "server.invalidPostType",
  "Code snippet cannot exceed 5000 characters": "server.codeTooLong",
  "Each image must be 5MB or smaller": "server.imageTooBig",
  "You can attach up to 4 images": "server.imageLimit",
  "Only JPG, PNG, WebP and GIF images are allowed": "server.imageType",
  "You can only edit your own posts": "server.editOwnPost",
  "You can only delete your own posts": "server.deleteOwnPost",
  "post not found": "server.postNotFound",
  "post unavailable": "server.postNotFound",
    "Comment cannot be empty": "server.commentEmpty",
  "Comment cannot exceed 1000 characters": "server.commentTooLong",
  "You can only reply to top-level comments": "server.replyTopLevelOnly",
  "You can only edit your own comments": "server.editOwnComment",
  "You can't delete this comment": "server.deleteCommentDenied",
  "comment not found": "server.commentNotFound",
  "comment unavailable": "server.commentNotFound",
  "You can't follow yourself": "server.followSelf",
  "user not found": "server.userNotFound",
  "user unavailable": "server.userNotFound",
  "Choose a reason for your report": "server.reportChooseReason",
  "Please describe the problem": "server.reportDescribe",
  "You can't report your own post": "server.reportOwnPost",
  "You've reached today's report limit": "server.reportLimit",
  "You've already reported this post": "server.reportDuplicate",
  "You can't suspend yourself": "server.suspendSelf",
  "Admins can't be suspended": "server.suspendAdmin",
  "This user is already suspended": "server.alreadySuspended",
  "This user isn't suspended": "server.notSuspended",
    "Session not found": "server.sessionNotFound",
  "Admin access required": "server.adminRequired",
  "Invalid receiver": "server.transferInvalidReceiver",
  "Cannot transfer reputation to yourself": "server.transferSelf",
  "A reason is required": "server.transferReasonRequired",
  "Invalid amount": "server.transferInvalidAmount",
  "Cannot transfer more than 50 points per transaction": "server.transferMax",
  "You need more than 50 reputation to transfer points": "server.transferNeedRep",
  "Insufficient reputation": "server.transferInsufficient",
  "User not found": "server.userNotFound",
};

const messageOf = (error: any): string | undefined => {
  const data = error?.response?.data;
  return typeof data === "string" ? data : data?.message;
};

// Messages that contain numbers can't be matched exactly. The pattern pulls the
// numbers out so they can be put back into the translated sentence.
const SERVER_MESSAGE_PATTERNS: { pattern: RegExp; key: TranslationKey; vars: string[] }[] = [
  {
    pattern: /^Daily transfer limit exceeded\. You've sent (\d+)\/100 points today\.$/,
    key: "server.transferDailyLimit",
    vars: ["sent"],
  },
];

const translateServerMessage = (message: string | undefined, fallback: TranslationKey) => {
  if (message) {
    const exact = SERVER_MESSAGE_KEYS[message];
    if (exact) return tr(exact);

    for (const { pattern, key, vars } of SERVER_MESSAGE_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        const values: Record<string, string> = {};
        vars.forEach((name, index) => {
          values[name] = match[index + 1];
        });
        return tr(key, values);
      }
    }
  }
  return tr(fallback);
};

export const apiErrorMessage = (
  error: any,
  fallback: TranslationKey = "common.somethingWrong"
) => translateServerMessage(messageOf(error), fallback);

export const apiSuccessMessage = (message: string | undefined, fallback: TranslationKey) =>
  translateServerMessage(message, fallback);