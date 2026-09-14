import { useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "@/src/lib/axiosinstance";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axiosInstance.get("/question/getallquestion");
        setQuestions(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  if (loading) {
    return <div className="p-6">Loading questions...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Questions</h1>
      {questions.length === 0 ? (
        <p>No questions found.</p>
      ) : (
        questions.map((question: any) => (
          <div key={question._id} className="border-b py-4">
            <Link
              href={`/questions/${question._id}`}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              {question.questiontitle}
            </Link>
            <p className="text-gray-700 text-sm mb-2 line-clamp-2">
              {question.questionbody}
            </p>
          </div>
        ))
      )}
    </div>
  );
}