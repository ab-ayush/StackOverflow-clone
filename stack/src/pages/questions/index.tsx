import Mainlayout from "@/src/layout/Mainlayout";
import QuestionBrowser from "@/src/components/QuestionBrowser";

export default function QuestionsPage() {
  return (
    <Mainlayout>
      <QuestionBrowser titleKey="questions.allQuestions" />
    </Mainlayout>
  );
}