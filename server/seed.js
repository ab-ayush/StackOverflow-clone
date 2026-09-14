import mongoose from "mongoose";
import dotenv from "dotenv";
import question from "./models/question.js";

dotenv.config();

const sampleQuestions = [
  {
    questiontitle: "How do I center a div in CSS?",
    questionbody:
      "I've tried margin: auto but it's not working for vertical centering. What's the best modern approach using Flexbox or Grid?",
    questiontags: ["css", "html", "flexbox"],
    userposted: "demoUser1",
    userid: "000000000000000000000001",
  },
  {
    questiontitle: "React useState not updating immediately",
    questionbody:
      "I'm calling setState inside a function but when I log the value right after, it still shows the old value. Why does this happen and how do I fix it?",
    questiontags: ["react", "javascript", "hooks"],
    userposted: "demoUser2",
    userid: "000000000000000000000002",
  },
  {
    questiontitle: "Difference between let, const, and var in JavaScript",
    questionbody:
      "I understand var is function-scoped, but I'm confused about when to use let vs const, especially with closures in loops.",
    questiontags: ["javascript", "es6"],
    userposted: "demoUser3",
    userid: "000000000000000000000003",
  },
  {
    questiontitle: "MongoDB connection timeout in Node.js",
    questionbody:
      "My Express app keeps throwing a MongooseServerSelectionError after a few minutes of inactivity. How do I configure the connection to stay alive or reconnect automatically?",
    questiontags: ["mongodb", "node.js", "mongoose"],
    userposted: "demoUser1",
    userid: "000000000000000000000001",
  },
  {
    questiontitle: "How to properly type async functions in TypeScript",
    questionbody:
      "I have an async function that fetches data from an API but TypeScript keeps complaining about the return type. What's the correct way to type Promise-based functions?",
    questiontags: ["typescript", "async-await"],
    userposted: "demoUser2",
    userid: "000000000000000000000002",
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    await question.deleteMany({});
    console.log("Cleared existing questions");

    await question.insertMany(sampleQuestions);
    console.log(`Inserted ${sampleQuestions.length} sample questions`);

    await mongoose.disconnect();
    console.log("Done, disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDB();