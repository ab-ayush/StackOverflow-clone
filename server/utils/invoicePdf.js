import PDFDocument from "pdfkit";
import { PLANS } from "../config/plans.js";

export const PLAN_NAMES = { bronze: "Bronze", silver: "Silver", gold: "Gold" };
const PLAN_COLORS = { bronze: "#b45309", silver: "#6b7280", gold: "#ca8a04" };

export const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

// The default PDF fonts have no rupee sign, so amounts are written as INR.
export const formatMoney = (paise, currency = "INR") =>
  `${currency} ${(paise / 100).toFixed(2)}`;

// what the purchased plan gives, in plain English
const planPerks = (planId) => {
  const plan = PLANS[planId];
  if (!plan) return [];
  const perks = [];
  perks.push(
    plan.questionsPerDay === null
      ? "Unlimited question posting"
      : `${plan.questionsPerDay} questions per day`
  );
  if (plan.advancedSearch) perks.push("Advanced search filters");
  if (plan.searchBoost) perks.push("Highest search priority");
  if (plan.badge) perks.push(`${PLAN_NAMES[planId]} profile badge`);
  perks.push(
    plan.bookmarkLimit === null ? "Unlimited bookmarks" : `Up to ${plan.bookmarkLimit} bookmarks`
  );
  if (plan.visibility === "enhanced") perks.push("Enhanced profile visibility");
  if (plan.visibility === "featured") perks.push("Featured profile visibility");
  if (plan.support === "priority") perks.push("Priority support");
  if (plan.support === "priorityCustomer") perks.push("Priority customer support");
  if (plan.exclusive) perks.push("Exclusive community features");
  return perks;
};

export const buildInvoicePdf = ({ payment, user }) =>
  new Promise((resolve, reject) => {
    // margin 0: every element is placed by hand, so nothing can spill onto a second page
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PAGE_W = 595;
    const left = 50;
    const width = 495;
    const billing = payment.billingSnapshot || {};
    const planName = PLAN_NAMES[payment.plan] || payment.plan;
    const planColor = PLAN_COLORS[payment.plan] || "#1d4ed8";
    const amount = formatMoney(payment.amount, payment.currency);

    // ---------- header band ----------
    const headerGradient = doc.linearGradient(0, 0, PAGE_W, 0);
    headerGradient.stop(0, "#1d4ed8").stop(1, "#7c3aed");
    doc.rect(0, 0, PAGE_W, 130).fill(headerGradient);

    doc.roundedRect(left, 36, 46, 46, 10).fill("#ffffff");
    doc.font("Helvetica-Bold").fontSize(28).fillColor("#1d4ed8");
    doc.text("C", left, 45, { width: 46, align: "center" });
    doc.font("Helvetica-Bold").fontSize(24).fillColor("#ffffff");
    doc.text("CodeQuest", left + 60, 38);
    doc.font("Helvetica").fontSize(10).fillColor("#dbeafe");
    doc.text("Subscription invoice", left + 60, 68);

    doc.font("Helvetica-Bold").fontSize(30).fillColor("#ffffff");
    doc.text("INVOICE", left, 34, { width, align: "right" });
    doc.font("Helvetica").fontSize(11).fillColor("#dbeafe");
    doc.text(payment.invoiceNumber, left, 74, { width, align: "right" });

    // ---------- date, validity and status ----------
    const meta = (label, value, x) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#6b7280").text(label, x, 152);
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text(value, x, 167);
    };
    meta("INVOICE DATE", formatDate(payment.paidAt), left);
    meta("PLAN VALID UNTIL", formatDate(payment.periodEnd), 230);

    doc.font("Helvetica-Bold").fontSize(8).fillColor("#6b7280").text("STATUS", 410, 152);
    doc.roundedRect(410, 164, 62, 22, 11).fill("#dcfce7");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#15803d");
    doc.text("PAID", 410, 170, { width: 62, align: "center" });

    // ---------- billed to / payment details cards ----------
    const cardTop = 210;
    const drawCard = (x, title) => {
      doc.roundedRect(x, cardTop, 240, 150, 10).fillAndStroke("#f8fafc", "#e5e7eb");
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#1d4ed8").text(title, x + 16, cardTop + 16);
    };

    drawCard(left, "BILLED TO");
    const billedLines = [
      billing.fullName || user.name,
      billing.addressLine1,
      billing.addressLine2,
      [billing.city, billing.state, billing.postalCode].filter(Boolean).join(", "),
      billing.country,
      billing.gstin ? `GSTIN: ${billing.gstin}` : null,
      user.email,
    ].filter(Boolean);
    doc.font("Helvetica").fontSize(10).fillColor("#111827");
    doc.text(billedLines.join("\n"), left + 16, cardTop + 34, { width: 208, lineGap: 3 });

    drawCard(305, "PAYMENT DETAILS");
    const detail = (label, value, y, mono = true) => {
      doc.font("Helvetica").fontSize(8.5).fillColor("#6b7280").text(label, 321, y);
      doc.font(mono ? "Courier" : "Helvetica-Bold").fontSize(9.5).fillColor("#111827");
      doc.text(value, 321, y + 12, { width: 208 });
    };
    detail("Payment ID", payment.razorpayPaymentId || "-", cardTop + 34);
    detail("Order ID", payment.razorpayOrderId || "-", cardTop + 76);
    detail("Processed by", "Razorpay", cardTop + 112, false);

    // ---------- table ----------
    const tableTop = 385;
    doc.roundedRect(left, tableTop, width, 30, 8).fill("#0f172a");
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#ffffff");
    doc.text("DESCRIPTION", left + 16, tableTop + 11);
    doc.text("PERIOD", 300, tableTop + 11);
    doc.text("AMOUNT", left, tableTop + 11, { width: width - 16, align: "right" });

    const rowTop = tableTop + 46;
    doc.circle(left + 22, rowTop + 8, 6).fill(planColor);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827");
    doc.text(`${planName} plan`, left + 38, rowTop);
    doc.font("Helvetica").fontSize(9).fillColor("#6b7280");
    doc.text("30 days of premium access", left + 38, rowTop + 17);

    doc.font("Helvetica").fontSize(10).fillColor("#111827");
    doc.text(
      `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`,
      300,
      rowTop + 2,
      { width: 160 }
    );
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827");
    doc.text(amount, left, rowTop + 2, { width: width - 16, align: "right" });

    doc.moveTo(left, rowTop + 44).lineTo(left + width, rowTop + 44).lineWidth(1);
    doc.strokeColor("#e5e7eb").stroke();

    // ---------- total ----------
    const totalTop = rowTop + 62;
    doc.roundedRect(335, totalTop, 210, 64, 10).fill("#eff6ff");
    doc.font("Helvetica").fontSize(10).fillColor("#6b7280").text("Total paid", 351, totalTop + 14);
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#1d4ed8");
    doc.text(amount, 335, totalTop + 30, { width: 194, align: "right" });

    // ---------- what the plan includes ----------
    const perks = planPerks(payment.plan);
    const rows = Math.ceil(perks.length / 2);
    const perksTop = totalTop + 88;
    doc.roundedRect(left, perksTop, width, 44 + rows * 20, 10).fillAndStroke("#ffffff", "#e5e7eb");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#1d4ed8");
    doc.text("YOUR PLAN INCLUDES", left + 16, perksTop + 16);
    perks.forEach((perk, index) => {
      const x = left + 16 + (index % 2) * 240;
      const y = perksTop + 38 + Math.floor(index / 2) * 20;
      doc.circle(x + 4, y + 5, 3).fill("#16a34a");
      doc.font("Helvetica").fontSize(10).fillColor("#374151").text(perk, x + 16, y, { width: 210 });
    });

    // ---------- footer ----------
    doc.font("Helvetica").fontSize(8.5).fillColor("#9ca3af");
    doc.text(
      "This is a computer-generated invoice and does not need a signature.",
      left,
      774,
      { width, align: "center" }
    );
    const footerGradient = doc.linearGradient(0, 0, PAGE_W, 0);
    footerGradient.stop(0, "#1d4ed8").stop(1, "#7c3aed");
    doc.rect(0, 806, PAGE_W, 36).fill(footerGradient);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff");
    doc.text("Thank you for being part of CodeQuest", 0, 820, { width: PAGE_W, align: "center" });

    doc.end();
  });