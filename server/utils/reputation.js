import User from "../models/auth.js";
import ReputationLog from "../models/reputationLog.js";

/**
 * Award or deduct reputation and log it.
 * amount can be positive (award) or negative (deduct).
 * Never lets reputation go below 0.
 */
export const applyReputation = async ({
  userId,
  amount,
  reason,
  relatedQuestion = null,
  relatedAnswerId = null,
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const newReputation = Math.max(0, user.reputation + amount);
    user.reputation = newReputation;
    await user.save();

    await ReputationLog.create({
      user: userId,
      amount,
      reason,
      relatedQuestion,
      relatedAnswerId,
    });

    return newReputation;
  } catch (error) {
    console.log("Reputation update failed:", error);
    return null;
  }
};