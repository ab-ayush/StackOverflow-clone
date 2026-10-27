import Payment from "../models/payment.js";
import User from "../models/auth.js";
import { TERM_DAYS, effectivePlanId } from "../config/plans.js";
import { ensureInvoice } from "./invoice.js";
import { sendInvoiceEmail } from "./invoiceEmail.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Only the call that flips the payment from "created" to "paid" changes the user.
export const activatePayment = async (paymentId, razorpayPaymentId) => {
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: "created" },
    { status: "paid", razorpayPaymentId, paidAt: new Date() },
    { new: true }
  );

  if (!payment) {
    // already activated: a double click, a retry, or the webhook got there first
    return { activated: false, payment: await Payment.findById(paymentId) };
  }

  const user = await User.findById(payment.user);
  const now = new Date();
  // same plan still running: the new 30 days start after it. Otherwise start now.
  const start =
    effectivePlanId(user, now) === payment.plan ? new Date(user.planExpiresAt) : now;
  const end = new Date(start.getTime() + TERM_DAYS * DAY_MS);

  await User.findByIdAndUpdate(payment.user, { plan: payment.plan, planExpiresAt: end });
  payment.periodStart = start;
  payment.periodEnd = end;
  await payment.save();

  // unique invoice number + a copy of the billing details
  const withInvoice = await ensureInvoice(payment._id);

  // the email must never slow down or break a successful payment
  sendInvoiceEmail(payment._id).catch((error) =>
    console.log("Invoice email failed:", error.message)
  );

  return { activated: true, payment: withInvoice || payment };
};