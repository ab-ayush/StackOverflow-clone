import crypto from "crypto";
import mongoose from "mongoose";
import Payment from "../models/payment.js";
import User from "../models/auth.js";
import BillingProfile from "../models/billingProfile.js";
import { PLANS, PLAN_IDS, TERM_DAYS, effectivePlanId, tierOf } from "../config/plans.js";
import { getRazorpay } from "../utils/razorpay.js";
import { activatePayment } from "../utils/subscription.js";
import { BILLING_FIELDS, ensureInvoice, pickBilling } from "../utils/invoice.js";
import { buildInvoicePdf } from "../utils/invoicePdf.js";
import { sendInvoiceEmail } from "../utils/invoiceEmail.js";
import Question from "../models/question.js";
import Bookmark from "../models/bookmark.js";
import { startOfTodayIST, startOfTomorrowIST } from "../utils/usage.js";

const PAID_PLANS = ["bronze", "silver", "gold"];
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const subscriptionView = (user) => {
  const stored = user.plan || "free";
  const effective = effectivePlanId(user);
  let status = "free";
  if (stored !== "free") status = effective === "free" ? "expired" : "active";
  return {
    plan: effective, // what the user can use right now
    storedPlan: stored, // the last plan bought, even if it has expired
    status,
    expiresAt: stored !== "free" ? user.planExpiresAt : null,
  };
};

export const getPlans = (req, res) => {
  res.status(200).json({ data: PLAN_IDS.map((id) => PLANS[id]), termDays: TERM_DAYS });
};

export const getMySubscription = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("plan planExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ data: subscriptionView(user) });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const createOrder = async (req, res) => {
  const { plan } = req.body;
  // the price comes from the server config, never from the browser
  if (!PAID_PLANS.includes(plan)) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    const user = await User.findById(req.userId).select("name email plan planExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (tierOf(plan) < tierOf(effectivePlanId(user))) {
      return res.status(400).json({ message: "You already have a higher plan active" });
    }

    const amount = PLANS[plan].priceInr * 100; // paise
    const receipt = `sub_${String(user._id).slice(-8)}_${Date.now().toString(36)}`;

    const order = await getRazorpay().orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: { userId: String(user._id), plan },
    });

    await Payment.create({
      user: user._id,
      plan,
      amount,
      razorpayOrderId: order.id,
      receipt,
    });

    res.status(200).json({
      data: {
        orderId: order.id,
        amount,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        plan,
        prefill: { name: user.name, email: user.email },
      },
    });
  } catch (error) {
    console.log(error?.error || error);
    if (error.message === "Payments are not configured") {
      return res.status(500).json({ message: error.message });
    }
    res.status(500).json("something went wrong..");
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Payment verification failed" });
  }

  try {
    // the order must belong to the logged-in user
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.userId,
    });
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(String(razorpay_signature));
    const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
    if (!valid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    const result = await activatePayment(payment._id, razorpay_payment_id);
    const user = await User.findById(req.userId).select("plan planExpiresAt");

    res.status(200).json({
      data: {
        ...subscriptionView(user),
        invoiceNumber: result.payment?.invoiceNumber || null,
      },
      alreadyProcessed: !result.activated,
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Payment verification failed" });
    }
    res.status(500).json("something went wrong..");
  }
};

// ---------- billing details ----------

export const getBilling = async (req, res) => {
  try {
    const profile = await BillingProfile.findOne({ user: req.userId }).lean();
    res.status(200).json({ data: profile ? pickBilling(profile) : null });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const saveBilling = async (req, res) => {
  const data = {};
  for (const field of BILLING_FIELDS) {
    data[field] = String(req.body?.[field] ?? "").trim().slice(0, 120);
  }
  data.gstin = data.gstin.toUpperCase();

  const required = ["fullName", "addressLine1", "city", "state", "postalCode", "country"];
  if (required.some((field) => !data[field])) {
    return res.status(400).json({ message: "Please fill in all required billing fields" });
  }
  if (data.country.toLowerCase() === "india" && !/^\d{6}$/.test(data.postalCode)) {
    return res.status(400).json({ message: "Enter a valid 6-digit PIN code" });
  }
  if (data.gstin && !GSTIN.test(data.gstin)) {
    return res.status(400).json({ message: "Enter a valid GSTIN" });
  }

  try {
    const saved = await BillingProfile.findOneAndUpdate(
      { user: req.userId },
      { ...data, user: req.userId },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.status(200).json({ data: pickBilling(saved) });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

// ---------- payment history and invoices ----------

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.userId, status: "paid" })
      .sort({ paidAt: -1 })
      .select("plan amount currency paidAt periodStart periodEnd invoiceNumber invoiceEmailedAt");
    res.status(200).json({ data: payments });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

// only the owner can reach their own paid payments
const findOwnPaidPayment = async (req) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return Payment.findOne({ _id: id, user: req.userId, status: "paid" });
};

export const downloadInvoice = async (req, res) => {
  try {
    const found = await findOwnPaidPayment(req);
    if (!found) return res.status(404).json({ message: "Payment not found" });

    const payment = await ensureInvoice(found._id);
    const user = await User.findById(req.userId).select("name email");
    const pdf = await buildInvoicePdf({ payment, user });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${payment.invoiceNumber}.pdf"`
    );
    res.status(200).send(pdf);
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};

export const resendInvoice = async (req, res) => {
  try {
    const found = await findOwnPaidPayment(req);
    if (!found) return res.status(404).json({ message: "Payment not found" });

    if (found.invoiceEmailedAt && Date.now() - found.invoiceEmailedAt.getTime() < 60 * 1000) {
      return res
        .status(429)
        .json({ message: "Please wait a minute before requesting the invoice again" });
    }

    await sendInvoiceEmail(found._id);
    res.status(200).json({ message: "Invoice sent" });
  } catch (error) {
    console.log("Invoice email failed:", error.message);
    res.status(500).json({ message: "Could not send the invoice email" });
  }
};
// ---------- how much of the plan's limits the user has used ----------

export const getUsage = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("plan planExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    const planId = effectivePlanId(user);
    const plan = PLANS[planId];

    const [questionsUsed, bookmarksUsed] = await Promise.all([
      Question.countDocuments({
        userid: String(req.userId),
        askedon: { $gte: startOfTodayIST() },
      }),
      Bookmark.countDocuments({ user: req.userId }),
    ]);

    res.status(200).json({
      data: {
        plan: planId,
        questions: {
          used: questionsUsed,
          limit: plan.questionsPerDay,
          resetsAt: startOfTomorrowIST(),
        },
        bookmarks: { used: bookmarksUsed, limit: plan.bookmarkLimit },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
  }
};
// Razorpay calls this by itself after a payment, so a user who pays and closes the tab still gets the plan.
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    if (!secret || !signature) return res.status(400).json({ message: "Invalid webhook" });

    // req.body is the raw body here, exactly as Razorpay signed it
    const expected = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ message: "Invalid webhook" });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const entity = event.payload?.payment?.entity;
      if (entity?.order_id && entity?.id) {
        const payment = await Payment.findOne({ razorpayOrderId: entity.order_id });
        // the amount Razorpay reports must match the order we created
        if (payment && entity.amount === payment.amount) {
          await activatePayment(payment._id, entity.id);
        }
      }
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Webhook error" });
  }
};