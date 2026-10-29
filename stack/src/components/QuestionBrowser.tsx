import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquare, Plus, ThumbsUp } from "lucide-react";
import axiosInstance from "@/src/lib/axiosinstance";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import PremiumButton from "@/src/components/PremiumButton";
import UserPlanBadge from "@/src/components/UserPlanBadge";
import { useUserPlans } from "@/src/lib/useUserPlans";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import type { TranslationKey } from "@/src/i18n/translate";

type Sort = "newest" | "votes" | "answers" | "unanswered";

const PAGE_SIZE = 10;

const votesOf = (q: any) => (q.upvote?.length || 0) - (q.downvote?.length || 0);
const answersOf = (q: any) => q.noofanswer ?? q.answer?.length ?? 0;
const hasAccepted = (q: any) => (q.answer || []).some((a: any) => a.accepted);
const byNewest = (a: any, b: any) =>
  new Date(b.askedon).getTime() - new Date(a.askedon).getTime();

// a short plain-text preview: no code blocks, no markdown symbols
const excerptOf = (body = "") =>
  body
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*`>_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

export default function QuestionBrowser({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useLanguage();
  const { date, number, plural } = useFormatters();
  const userPlans = useUserPlans();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<Sort>("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);

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

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [sort]);

  const sorted = useMemo(() => {
    let list = [...questions];
    if (sort === "unanswered") list = list.filter((q) => answersOf(q) === 0);
    if (sort === "votes") list.sort((a, b) => votesOf(b) - votesOf(a) || byNewest(a, b));
    else if (sort === "answers") list.sort((a, b) => answersOf(b) - answersOf(a) || byNewest(a, b));
    else list.sort(byNewest);
    return list;
  }, [questions, sort]);

  const tabs: { id: Sort; label: string }[] = [
    { id: "newest", label: t("home.filter.newest") },
    { id: "votes", label: t("search.sort.votes") },
    { id: "answers", label: t("search.sort.answers") },
    { id: "unanswered", label: t("home.filter.unanswered") },
  ];

  const tabClass = (id: Sort) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
      sort === id
        ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/30"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">{t(titleKey)}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500">
              {t(
                plural(sorted.length) === "one"
                  ? "home.questionCount.one"
                  : "home.questionCount.other",
                { count: number(sorted.length) }
              )}
            </p>
          )}
        </div>
        <PremiumButton href="/ask" icon={<Plus className="h-4 w-4" />}>
          {t("home.askQuestion")}
        </PremiumButton>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab.id} className={tabClass(tab.id)} onClick={() => setSort(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3" role="status" aria-label={t("questions.loading")}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border bg-gray-100" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">
          {t("home.noQuestions")}
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.slice(0, visible).map((question) => {
            const votes = votesOf(question);
            const answers = answersOf(question);
            const accepted = hasAccepted(question);
            const gold = userPlans[question.userid] === "gold";

            return (
              <div
                key={question._id}
                className={`flex flex-col gap-4 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row ${
                  gold ? "border-yellow-300 bg-yellow-50/40" : "bg-white"
                }`}
              >
                <div className="flex shrink-0 gap-2 sm:w-28 sm:flex-col">
                  <div className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span className="font-semibold text-gray-900">{number(votes)}</span>
                    <span>
                      {t(plural(votes) === "one" ? "home.votes.one" : "home.votes.other")}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs ${
                      accepted
                        ? "bg-green-600 text-white"
                        : answers > 0
                        ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                        : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {accepted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                    <span className="font-semibold">{number(answers)}</span>
                    <span>
                      {t(plural(answers) === "one" ? "home.answers.one" : "home.answers.other")}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/questions/${question._id}`}
                      className="text-base font-semibold text-blue-600 hover:text-blue-800 lg:text-lg"
                    >
                      {question.questiontitle}
                    </Link>
                    {accepted && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {t("search.accepted")}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                    {excerptOf(question.questionbody)}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {(question.questiontags || []).map((tag: string) => (
                        <Link key={tag} href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer bg-blue-100 text-xs text-blue-800 hover:bg-blue-200"
                          >
                            {tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Link
                        href={`/users/${question.userid}`}
                        className="flex items-center gap-1.5 hover:text-blue-700"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {question.userposted?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-blue-600">{question.userposted}</span>
                      </Link>
                      <UserPlanBadge userId={question.userid} />
                      <span>· {t("home.askedOn", { date: date(question.askedon) })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {visible < sorted.length && (
            <div className="flex justify-center pt-2">
              <PremiumButton variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                {t("notifications.loadMore")}
              </PremiumButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}