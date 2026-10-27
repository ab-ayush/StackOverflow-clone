import express from "express";
import auth from "../middleware/auth.js";
import requireExclusive from "../middleware/requireExclusive.js";
import {
  getMessages,
  createMessage,
  deleteMessage,
  getMembers,
} from "../controller/lounge.js";

const router = express.Router();

// every lounge route needs a login and an active Gold plan
router.use(auth, requireExclusive);

router.get("/", getMessages);
router.post("/", createMessage);
router.get("/members", getMembers);
router.delete("/:id", deleteMessage);

export default router;