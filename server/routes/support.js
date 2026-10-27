import express from "express";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js";
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  replyToTicket,
} from "../controller/support.js";

const router = express.Router();

router.post("/", auth, createTicket);
router.get("/mine", auth, getMyTickets);
router.get("/admin/all", auth, isAdmin, getAllTickets);
router.patch("/admin/:id/reply", auth, isAdmin, replyToTicket);

export default router;