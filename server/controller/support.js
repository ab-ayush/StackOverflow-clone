import mongoose from "mongoose";
import SupportTicket from "../models/supportTicket.js";
import User from "../models/auth.js";
import { PLANS, effectivePlanId } from "../config/plans.js";
import { nextTicketNumber } from "../utils/ticketNumber.js";
import { sendMail } from "../utils/sendMail.js";

const PRIORITY_BY_SUPPORT = { standard: 0, priority: 1, priorityCustomer: 2 };
const PRIORITY_TAG = { 0: "STANDARD", 1: "PRIORITY", 2: "TOP PRIORITY" };
const MAX_OPEN_TICKETS = 5;

const ticketView = (ticket) => ({
  _id: ticket._id,
  number: ticket.number,
  subject: ticket.subject,
  message: ticket.message,
  plan: ticket.plan,
  priority: ticket.priority,
  status: ticket.status,
  adminReply: ticket.adminReply,
  repliedAt: ticket.repliedAt,
  createdAt: ticket.createdAt,
});

export const createTicket = async (req, res) => {
  const subject = String(req.body?.subject || "").trim().slice(0, 120);
  const message = String(req.body?.message || "").trim().slice(0, 2000);
  if (!subject || !message) {
    return res.status(400).json({ message: "Please enter a subject and a message" });
  }

  try {
    const user = await User.findById(req.userId).select("name email plan planExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    const open = await SupportTicket.countDocuments({ user: req.userId, status: "open" });
    if (open >= MAX_OPEN_TICKETS) {
      return res.status(429).json({ message: "You already have too many open tickets" });
    }

    const planId = effectivePlanId(user);
    const priority = PRIORITY_BY_SUPPORT[PLANS[planId].support] ?? 0;
    const number = await nextTicketNumber();

    const ticket = await SupportTicket.create({
      number,
      user: user._id,
      subject,
      message,
      plan: planId,
      priority,
    });

    // tell the support inbox; the tag in the subject shows how urgent it is
    const inbox = process.env.SUPPORT_EMAIL || process.env.EMAIL_USER;
    sendMail({
      to: inbox,
      subject: `[${PRIORITY_TAG[priority]} - ${planId.toUpperCase()}] ${number}: ${subject}`,
      text: [
        `Ticket ${number}`,
        `From: ${user.name} <${user.email}>`,
        `Plan: ${planId}`,
        "",
        message,
      ].join("\n"),
    }).catch((error) => console.log("Support email failed:", error.message));

    res.status(201).json({ data: ticketView(ticket) });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ data: tickets.map(ticketView) });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

// ---------- admin ----------

export const getAllTickets = async (req, res) => {
  try {
    const status = req.query.status === "closed" ? "closed" : "open";
    const tickets = await SupportTicket.find({ status })
      .sort(status === "open" ? { priority: -1, createdAt: 1 } : { repliedAt: -1 })
      .limit(100)
      .populate("user", "name username email")
      .lean();

    res.status(200).json({
      data: tickets.map((ticket) => ({
        ...ticketView(ticket),
        user: ticket.user
          ? {
              _id: ticket.user._id,
              name: ticket.user.name,
              username: ticket.user.username,
              email: ticket.user.email,
            }
          : null,
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const replyToTicket = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Ticket not found" });
  }
  const reply = String(req.body?.reply || "").trim().slice(0, 2000);
  if (!reply) return res.status(400).json({ message: "Please write a reply" });

  try {
    const ticket = await SupportTicket.findOneAndUpdate(
      { _id: id, status: "open" },
      { adminReply: reply, repliedAt: new Date(), repliedBy: req.userId, status: "closed" },
      { returnDocument: "after" }
    ).populate("user", "name email");
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    if (ticket.user?.email) {
      sendMail({
        to: ticket.user.email,
        subject: `Re: ${ticket.number} - ${ticket.subject}`,
        text: [
          `Hi ${ticket.user.name},`,
          "",
          `We have replied to your support ticket ${ticket.number}:`,
          "",
          reply,
          "",
          "The CodeQuest team",
        ].join("\n"),
      }).catch((error) => console.log("Reply email failed:", error.message));
    }

    res.status(200).json({ data: ticketView(ticket) });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};