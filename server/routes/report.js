import express from "express";
import { submitReport } from "../controller/report.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/submit", auth, submitReport);

export default router;