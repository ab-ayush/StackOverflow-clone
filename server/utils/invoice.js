import Counter from "../models/counter.js";
import Payment from "../models/payment.js";
import BillingProfile from "../models/billingProfile.js";

export const BILLING_FIELDS = [
  "fullName",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
  "gstin",
];

export const pickBilling = (source = {}) =>
  Object.fromEntries(BILLING_FIELDS.map((field) => [field, source[field] || ""]));

// INV-2026-000001, INV-2026-000002, ...  One counter per year, increased atomically.
export const nextInvoiceNumber = async (date = new Date()) => {
  const year = date.getFullYear();
  const key = `invoice-${year}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      return `INV-${year}-${String(counter.seq).padStart(6, "0")}`;
    } catch (error) {
      // two requests created the counter at the same moment: try again
      if (error.code !== 11000 || attempt === 2) throw error;
    }
  }
};

// Gives a paid payment its invoice number and a copy of the billing details.
// Safe to call any number of times: a payment is only numbered once.
export const ensureInvoice = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== "paid") return null;
  if (payment.invoiceNumber) return payment;

  const number = await nextInvoiceNumber(payment.paidAt || new Date());
  const billing = await BillingProfile.findOne({ user: payment.user }).lean();

  const updated = await Payment.findOneAndUpdate(
    {
      _id: paymentId,
      $or: [{ invoiceNumber: { $exists: false } }, { invoiceNumber: null }],
    },
    { invoiceNumber: number, billingSnapshot: billing ? pickBilling(billing) : null },
    { new: true }
  );

  // someone else numbered it first: use their number
  return updated || (await Payment.findById(paymentId));
};