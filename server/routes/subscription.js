import express from "express";
import auth from "../middleware/auth.js";
import {
  getPlans,
  getMySubscription,
  createOrder,
  verifyPayment,
  getBilling,
  saveBilling,
  getPayments,
  downloadInvoice,
  resendInvoice,
  getUsage,
} from "../controller/subscription.js";

const router = express.Router();

router.get("/plans", getPlans);
router.get("/me", auth, getMySubscription);
router.post("/order", auth, createOrder);
router.post("/verify", auth, verifyPayment);

router.get("/billing", auth, getBilling);
router.put("/billing", auth, saveBilling);
router.get("/payments", auth, getPayments);
router.get("/invoices/:id/download", auth, downloadInvoice);
router.post("/invoices/:id/resend", auth, resendInvoice);
router.get("/usage", auth, getUsage);

export default router;