import Payment from "../models/payment.js";
import User from "../models/auth.js";
import { ensureInvoice } from "./invoice.js";
import { buildInvoicePdf, formatDate, formatMoney, PLAN_NAMES } from "./invoicePdf.js";
import { sendMail } from "./sendMail.js";

const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char])
  );

export const sendInvoiceEmail = async (paymentId) => {
  const payment = await ensureInvoice(paymentId);
  if (!payment) throw new Error("Invoice not ready");

  const user = await User.findById(payment.user).select("name email");
  if (!user) throw new Error("User not found");

  const pdf = await buildInvoicePdf({ payment, user });
  const planName = PLAN_NAMES[payment.plan] || payment.plan;
  const name = payment.billingSnapshot?.fullName || user.name;
  const amount = formatMoney(payment.amount, payment.currency);
  const validFrom = formatDate(payment.periodStart);
  const validTo = formatDate(payment.periodEnd);

  const text = [
    `Hi ${name},`,
    "",
    `Thanks for subscribing to CodeQuest. Your ${planName} plan is now active.`,
    "",
    `Plan: ${planName} (30 days)`,
    `Amount paid: ${amount}`,
    `Valid: ${validFrom} to ${validTo}`,
    `Renewal date: ${validTo} (renew before then to keep your benefits)`,
    `Invoice number: ${payment.invoiceNumber}`,
    `Payment ID: ${payment.razorpayPaymentId}`,
    "",
    "Your invoice is attached as a PDF. You can also download it any time from Billing in your account.",
    "",
    "The CodeQuest team",
  ].join("\n");

  const row = (label, value) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#6b7280">${label}</td><td style="padding:6px 0;color:#111827"><strong>${escapeHtml(value)}</strong></td></tr>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#111827">
      <h2 style="color:#1d4ed8;margin-bottom:4px">CodeQuest</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for subscribing. Your <strong>${escapeHtml(planName)}</strong> plan is now active.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        ${row("Plan", `${planName} (30 days)`)}
        ${row("Amount paid", amount)}
        ${row("Valid", `${validFrom} to ${validTo}`)}
        ${row("Renewal date", validTo)}
        ${row("Invoice number", payment.invoiceNumber)}
        ${row("Payment ID", payment.razorpayPaymentId)}
      </table>
      <p>Your invoice is attached as a PDF. You can also download it any time from <strong>Billing</strong> in your account.</p>
      <p style="color:#6b7280;font-size:13px">Renew before ${escapeHtml(validTo)} to keep your benefits.</p>
    </div>`;

  await sendMail({
    to: user.email,
    subject: `Your CodeQuest ${planName} plan is active - invoice ${payment.invoiceNumber}`,
    text,
    html,
    attachments: [
      { filename: `${payment.invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" },
    ],
  });

  await Payment.findByIdAndUpdate(paymentId, { invoiceEmailedAt: new Date() });
};