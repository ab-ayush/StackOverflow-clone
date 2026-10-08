import express from "express";
import { Askanswer, deleteanswer, acceptAnswer, voteAnswer, adminDeleteAnswer } from "../controller/answer.js";
import isAdmin from "../middleware/isAdmin.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/postanswer/:id",auth, Askanswer);
router.delete("/delete/:id",auth,deleteanswer)
router.patch("/accept/:id", auth, acceptAnswer);
router.patch("/vote/:id", auth, voteAnswer);
router.delete("/admin/:id", auth, isAdmin, adminDeleteAnswer);

export default router;