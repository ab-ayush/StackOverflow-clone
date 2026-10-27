import express from "express";
import {
  Askquestion,
  deletequestion,
  getallquestion,
  votequestion,
  adminDeleteQuestion,
  searchQuestions,
} from "../controller/question.js";
import isAdmin from "../middleware/isAdmin.js";
import optionalAuth from "../middleware/optionalAuth.js";

const router = express.Router();
import auth from "../middleware/auth.js";
router.post("/ask", auth, Askquestion);
router.get("/getallquestion", getallquestion);
router.delete("/delete/:id", auth, deletequestion);
router.patch("/vote/:id", auth, votequestion);
router.delete("/admin/:id", auth, isAdmin, adminDeleteQuestion);
router.get("/search", optionalAuth, searchQuestions);

export default router;