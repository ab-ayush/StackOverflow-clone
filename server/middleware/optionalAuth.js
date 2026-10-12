import jwt from "jsonwebtoken";

// Logged-out visitors pass straight through. If a token IS sent it must be valid:
// an expired one returns 401, so the frontend's silent refresh runs and retries.
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.sessionId = decoded.sessionId;
    next();
  } catch (error) {
    res.status(401).json({
      message:
        error.name === "TokenExpiredError"
          ? "Session expired, please log in again"
          : "Invalid token",
    });
  }
};

export default optionalAuth;