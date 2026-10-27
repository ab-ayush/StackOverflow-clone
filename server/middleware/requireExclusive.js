import User from "../models/auth.js";
import { PLANS, effectivePlanId } from "../config/plans.js";

const requireExclusive = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("plan planExpiresAt isAdmin");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!PLANS[effectivePlanId(user)].exclusive) {
      return res.status(403).json({
        message: "This area is for Gold members",
        code: "PLAN_REQUIRED",
        requiredPlan: "gold",
      });
    }
    req.isAdminUser = !!user.isAdmin;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export default requireExclusive;