import express from "express";
import { transferReputation, getTransferHistory } from "../controller/reputationTransfer.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/send", auth, transferReputation);
router.get("/history", auth, getTransferHistory);

export default router;