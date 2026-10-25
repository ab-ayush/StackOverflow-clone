import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import Mainlayout from "@/src/layout/Mainlayout";
import axiosInstance from "@/src/lib/axiosinstance";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import type { TranslationKey } from "@/src/i18n/translate";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const [question, setquestion] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();
  const { date, number, plural } = useFormatters();

  // picks the singular or plural wording for a count, following the language's own rules
  const countLabel = (count: number, one: TranslationKey, other: TranslationKey) =>
    t(plural(count) === "one" ? one : other);

  useEffect(() => {
    const fetchquestion = async () => {
      try {
        const res = await axiosInstance.get("/question/getallquestion");
        setquestion(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchquestion();
  }, []);
  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }
  if (!question || question.length === 0) {
    return (
      <Mainlayout>
        <div className="text-center text-gray-500 mt-4">
          {t("home.noQuestions")}
        </div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <main className="min-w-0 p-4 lg:p-6 ">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl lg:text-2xl font-semibold">
            {t("home.topQuestions")}
          </h1>
          <button
            onClick={() => router.push("/ask")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
          >
            {t("home.askQuestion")}
          </button>
        </div>
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 text-sm gap-2 sm:gap-4">
            <span className="text-gray-600">
              {t(
                plural(question.length) === "one"
                  ? "home.questionCount.one"
                  : "home.questionCount.other",
                { count: number(question.length) }
              )}
            </span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <button className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs sm:text-sm">
                {t("home.filter.newest")}
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm">
                {t("home.filter.active")}
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded flex items-center text-xs sm:text-sm">
                {t("home.filter.bountied")}
                <Badge variant="secondary" className="ml-1 text-xs">
                  25
                </Badge>
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm">
                {t("home.filter.unanswered")}
              </button>
              <button className="px-2 sm:px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-xs sm:text-sm">
                {t("home.filter.more")} ▼
              </button>
              <button className="px-2 sm:px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded ml-auto text-xs sm:text-sm">
                🔍 {t("home.filter.filter")}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {question.map((question: any) => (
              <div key={question._id} className="border-b border-gray-200 pb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex sm:flex-col items-center sm:items-center text-sm text-gray-600 sm:w-16 lg:w-20 gap-4 sm:gap-2">
                    <div className="text-center">
                      <div className="font-medium">
                        {number(question.upvote.length)}
                      </div>
                      <div className="text-xs">
                        {countLabel(
                          question.upvote.length,
                          "home.votes.one",
                          "home.votes.other"
                        )}
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-medium ${
                          question.answer.length > 0
                            ? "text-green-600 bg-green-100 px-2 py-1 rounded"
                            : ""
                        }`}
                      >
                        {number(question.noofanswer)}
                      </div>
                      <div className="text-xs">
                        {countLabel(
                          question.noofanswer,
                          "home.answers.one",
                          "home.answers.other"
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/questions/${question._id}`}
                      className="text-blue-600 hover:text-blue-800 text-base lg:text-lg font-medium mb-2 block"
                    >
                      {question.questiontitle}
                    </Link>
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {question.questionbody}
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {question.questiontags.map((tag: any) => (
                          <div key={tag}>
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            >
                              {tag}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center text-xs text-gray-600 flex-shrink-0">
                        <Link
                          href={`/users/${question.userid}`}
                          className="flex items-center"
                        >
                          <Avatar className="w-4 h-4 mr-1">
                            <AvatarFallback className="text-xs">
                              {question.userposted[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-blue-600 hover:text-blue-800 mr-1">
                            {question.userposted}
                          </span>
                        </Link>

                        <span>
                          {t("home.askedOn", { date: date(question.askedon) })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </Mainlayout>
  );
}