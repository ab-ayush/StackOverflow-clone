import User from "../models/auth.js";

const isAdmin = async (req, res, next) => {
  try {
    const requester = await User.findById(req.userId);
    if (!requester?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

export default isAdmin;