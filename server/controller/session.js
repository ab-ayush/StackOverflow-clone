import Session from "../models/session.js";
import User from "../models/auth.js";

// GET /session/mine — list all active sessions for the logged-in user
export const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.userId }).sort({
      lastActiveAt: -1,
    });

    const currentSessionId = req.sessionId; // set by authenticate middleware from JWT payload

    const formatted = sessions.map((s) => ({
      id: s._id,
      browser: s.browser,
      os: s.os,
      deviceType: s.deviceType,
      ip: s.ip,
      location: s.location,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s._id.toString() === currentSessionId,
    }));

    res.status(200).json({ data: formatted });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

// DELETE /session/:sessionId — revoke one specific session
export const revokeSession = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const session = await Session.findOne({ _id: sessionId, user: req.userId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await Session.deleteOne({ _id: sessionId });
    res.status(200).json({ message: "Session revoked" });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

// DELETE /session — revoke all sessions except the current one ("log out other devices")
export const revokeAllOtherSessions = async (req, res) => {
  try {
    await Session.deleteMany({
      user: req.userId,
      _id: { $ne: req.sessionId },
    });
    res.status(200).json({ message: "All other sessions revoked" });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};

// GET /session/admin/all — admin-only, view all sessions across users
export const getAllSessionsAdmin = async (req, res) => {
  try {
    const requester = await User.findById(req.userId);
    if (!requester?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const sessions = await Session.find()
      .populate("user", "name email")
      .sort({ lastActiveAt: -1 });

    res.status(200).json({ data: sessions });
  } catch (error) {
    res.status(500).json("something went wrong..");
  }
};
