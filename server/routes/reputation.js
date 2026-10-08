import express from "express";
import { getReputationLog } from "../controller/reputation.js";

const router = express.Router();

router.get("/log/:id", getReputationLog);

export default router;