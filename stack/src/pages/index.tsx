import Mainlayout from "@/src/layout/Mainlayout";
import QuestionBrowser from "@/src/components/QuestionBrowser";

export default function Home() {
  return (
    <Mainlayout>
      <QuestionBrowser titleKey="home.topQuestions" />
    </Mainlayout>
  );
}