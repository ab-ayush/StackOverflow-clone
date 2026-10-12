import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/auth.js";

const auth = async (req, res, next) => {
  try {
    const cookieToken = req.cookies?.accessToken;
    const headerToken = req.headers.authorization?.split(" ")[1];
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // suspended accounts are blocked at once, not when their token expires
    const account = await User.findById(decoded.id).select("suspendedAt").lean();
    if (!account) {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (account.suspendedAt) {
      return res
        .status(403)
        .json({ message: "Your account has been suspended", suspended: true });
    }

    req.userId = decoded.id;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }
    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.log(error);
    return res.status(500).json("something went wrong..");
  }
};

export default auth;