import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Mainlayout from "@/src/layout/Mainlayout";
import axiosInstance from "@/src/lib/axiosinstance";
import { Badge } from "@/src/components/ui/badge";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const TagQuestionsPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { date, number, plural } = useFormatters();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // The tag comes from the URL (/tags/javascript). If the file's brackets were
  // named differently, the last part of the path still gives the right value.
  const fromQuery = router.query.tag;
  const fromPath = safeDecode(
    router.asPath.split("?")[0].split("#")[0].split("/").filter(Boolean).pop() || ""
  );
  const tag = router.isReady
    ? (typeof fromQuery === "string" ? fromQuery : fromPath).toLowerCase()
    : null;

  useEffect(() => {
    if (!router.isReady) return;
    if (!tag) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await axiosInstance.get("/question/getallquestion");
        if (cancelled) return;
        setQuestions(
          (res.data.data as any[]).filter((question) =>
            (question.questiontags || []).some(
              (item: string) => item.trim().toLowerCase() === tag
            )
          )
        );
      } catch (error) {
        console.log(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, tag]);

  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <Link href="/tags" className="text-sm text-blue-600 hover:underline">
          ← {t("tags.backToTags")}
        </Link>

        {tag && (
          <div className="flex flex-wrap items-center gap-3 mt-3 mb-6">
            <h1 className="text-xl lg:text-2xl font-semibold">
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 text-base"
              >
                {tag}
              </Badge>
            </h1>
            {!loading && (
              <span className="text-sm text-gray-600">
                {t(
                  plural(questions.length) === "one"
                    ? "home.questionCount.one"
                    : "home.questionCount.other",
                  { count: number(questions.length) }
                )}
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mt-4"></div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("tags.noQuestions")}</p>
        ) : (
          <div>
            {questions.map((question) => (
              <div key={question._id} className="border-b py-4">
                <Link
                  href={`/questions/${question._id}`}
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {question.questiontitle}
                </Link>
                <p className="text-gray-700 text-sm my-2 line-clamp-2">
                  {question.questionbody}
                </p>
                <div className="flex flex-wrap items-center gap-1 text-xs text-gray-600">
                  <Link
                    href={`/users/${question.userid}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {question.userposted}
                  </Link>
                  <span>· {t("home.askedOn", { date: date(question.askedon) })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default TagQuestionsPage;