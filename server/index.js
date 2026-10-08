import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js"
import questionroute from "./routes/question.js"
import answerroutes from "./routes/answer.js"
import sessionRoutes from "./routes/session.js";
import cookieParser from "cookie-parser";
import reportRoutes from "./routes/report.js";
import reputationTransferRoutes from "./routes/reputationTransfer.js";
import reputationRoutes from "./routes/reputation.js";
const app = express();
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL, // e.g. "http://localhost:3000"
  credentials: true,
}));
app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect");
});
app.use('/user',userroutes)
app.use('/question',questionroute)
app.use('/answer',answerroutes)
app.use("/session", sessionRoutes)
app.use("/report", reportRoutes)
app.use('/reputation-transfer', reputationTransferRoutes)
app.use('/reputation', reputationRoutes)
const PORT = process.env.PORT || 5000;
const databaseurl = process.env.MONGODB_URL;

mongoose
  .connect(databaseurl)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });