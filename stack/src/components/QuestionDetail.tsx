import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  History,
  Share,
  Trash,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import axiosInstance from "@/src/lib/axiosinstance";
import { useAuth } from "@/src/lib/AuthContext";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { formatWithElements } from "@/src/i18n/format";
import { apiErrorMessage } from "@/src/i18n/runtime";
import { renderMarkdown } from "@/src/lib/renderMarkdown";
import UserPlanBadge from "@/src/components/UserPlanBadge";

const QuestionDetail = ({ questionId }: any) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { date, number, plural } = useFormatters();
  const [question, setquestion] = useState<any>(null);
  const [answer, setanswer] = useState<any>();
  const [newanswer, setnewAnswer] = useState("");
  const [isSubmitting, setisSubmitting] = useState(false);
  const [loading, setloading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    const fetchuser = async () => {
      try {
        const res = await axiosInstance.get("/question/getallquestion");
        const matchedquestion = res.data.data.find(
          (u: any) => u._id === questionId,
        );
        setanswer(matchedquestion.answer);
        setquestion(matchedquestion);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, [questionId]);
  if (loading) {
    return (
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    );
  }
  if (!question) {
    return (
      <div className="text-center text-gray-500 mt-4">
        {t("question.notFound")}
      </div>
    );
  }

  const requireLogin = () => {
    toast.info(t("common.loginRequired"));
    router.push("/auth");
  };

  const handleVote = async (vote: String) => {
    if (!user) {
      requireLogin();
      return;
    }
    try {
      const res = await axiosInstance.patch(`/question/vote/${question._id}`, {
        value: vote,
        userid: user?._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success(t("question.voteUpdated"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("question.voteFailed"));
    }
  };
  const handlebookmark = () => {
    setquestion((prev: any) => ({ ...prev, isBookmarked: !prev.isBookmarked }));
  };
  const handleSubmitanswer = async () => {
    if (!user) {
      requireLogin();
      return;
    }
    if (!newanswer.trim()) return;
    setisSubmitting(true);
    try {
      const res = await axiosInstance.post(
        `/answer/postanswer/${question?._id}`,
        {
          noofanswer: question.noofanswer,
          answerbody: newanswer,
          useranswered: user.name,
          userid: user._id,
        },
      );
      if (res.data.data) {
        const newObj = {
          answerbody: newanswer,
          useranswered: user.name,
          userid: user._id,
          answeredon: new Date().toISOString(),
        };
        setquestion((prev: any) => ({
          ...prev,
          noofanswer: prev.noofanswer + 1,
          answer: [...(prev.answer || []), newObj],
        }));
        toast.success(t("question.answerUploaded"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("question.answerFailed"));
    } finally {
      setnewAnswer("");
      setisSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if (!user) {
      requireLogin();
      return;
    }
    if (!window.confirm(t("question.confirmDeleteQuestion"))) return;
    try {
      const res = await axiosInstance.delete(
        `/question/delete/${question._id}`,
      );
      if (res.data.message) {
        toast.success(apiErrorMessage({ response: { data: res.data } }, "question.questionRemoved"));
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(t("question.deleteQuestionFailed"));
    }
  };
  const handleDeleteanswer = async (id: String) => {
    if (!user) {
      requireLogin();
      return;
    }
    if (!window.confirm(t("question.confirmDeleteAnswer"))) return;
    try {
      const res = await axiosInstance.delete(`/answer/delete/${question._id}`, {
        data: {
          noofanswer: question.noofanswer,
          answerid: id,
        },
      });
      if (res.data.data) {
        const updateanswer = question.answer.filter(
          (ans: any) => ans._id !== id,
        );
        setquestion((prev: any) => ({
          ...prev,
          noofanswer: updateanswer.length,
          answer: updateanswer,
        }));
        toast.success(t("question.answerDeleted"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("question.deleteAnswerFailed"));
    }
  };
  const handleAcceptAnswer = async (answerId: string) => {
    if (!user) {
      requireLogin();
      return;
    }
    try {
      const res = await axiosInstance.patch(`/answer/accept/${question._id}`, {
        answerid: answerId,
        userid: user._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
        toast.success(t("question.answerStatusUpdated"));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(apiErrorMessage(error, "question.answerStatusFailed"));
    }
  };
  const handleAnswerVote = async (answerId: string, vote: string) => {
    if (!user) {
      requireLogin();
      return;
    }
    try {
      const res = await axiosInstance.patch(`/answer/vote/${question._id}`, {
        answerid: answerId,
        value: vote,
        userid: user._id,
      });
      if (res.data.data) {
        setquestion(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("question.answerVoteFailed"));
    }
  };
  const handleAdminDeleteQuestion = async () => {
    if (!window.confirm(t("question.confirmAdminRemoveQuestion"))) return;
    try {
      const res = await axiosInstance.delete(`/question/admin/${question._id}`);
      if (res.data.message) {
        toast.success(t("question.questionRemoved"));
        router.push("/");
      }
    } catch (error) {
      console.error(error);
      toast.error(t("question.removeQuestionFailed"));
    }
  };
  const handleAdminDeleteAnswer = async (answerId: string) => {
    if (!window.confirm(t("question.confirmAdminRemoveAnswer"))) return;
    try {
      const res = await axiosInstance.delete(`/answer/admin/${question._id}`, {
        data: { answerid: answerId },
      });
      if (res.data.message) {
        toast.success(t("question.answerRemoved"));
        const updateanswer = question.answer.filter(
          (ans: any) => ans._id !== answerId,
        );
        setquestion((prev: any) => ({ ...prev, answer: updateanswer }));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("question.removeAnswerFailed"));
    }
  };
  const handleReport = async (
    contentType: "question" | "answer",
    contentId: string,
    relatedQuestion?: string,
  ) => {
    if (!user) {
      requireLogin();
      return;
    }
    if ((user.reputation || 0) < 500) {
      toast.info(t("question.reportNeedsReputation"));
      return;
    }
    const reason = window.prompt(t("question.reportPrompt"));
    if (!reason || !reason.trim()) return;

    try {
      const res = await axiosInstance.post("/report/submit", {
        contentType,
        contentId,
        relatedQuestion,
        reason,
      });
      if (res.data.message) {
        toast.success(t("question.reportSubmitted"));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(apiErrorMessage(error, "question.reportFailed"));
    }
  };

  const answerTotal = question.answer.length;

  return (
    <div className="max-w-5xl">
      {/* Question Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-semibold mb-4 text-gray-900">
          {question.questiontitle}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>
              {t("question.askedHeader", { date: date(question.askedon) })}
            </span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Voting Section */}
            <div className="flex sm:flex-col items-center sm:items-center p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-200">
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${"text-gray-600 hover:text-orange-500"}`}
                onClick={() => handleVote("upvote")}
              >
                <ChevronUp className="w-6 h-6" />
              </Button>
              <span>
                {number(question.upvote.length - question.downvote.length)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${"text-gray-600 hover:text-orange-500"}`}
                onClick={() => handleVote("downvote")}
              >
                <ChevronDown className="w-6 h-6" />
              </Button>
              <div className="flex sm:flex-col gap-2 sm:gap-4 mt-4 sm:mt-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${
                    question?.isBookmarked
                      ? "text-yellow-500"
                      : "text-gray-600 hover:text-yellow-500"
                  }`}
                  onClick={handlebookmark}
                >
                  <Bookmark
                    className="w-5 h-5"
                    fill={question?.isBookmarked ? "currentColor" : "none"}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <History className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 sm:p-6">
              <div className="prose max-w-none mb-6">
                <div
                  className="text-gray-800 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(question.questionbody),
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {question.questiontags.map((tag: any) => (
                  <Link key={tag} href={`/tags/${tag}`}>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Share className="w-4 h-4 mr-1" />
                    {t("question.share")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReport("question", question._id)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {t("question.flag")}
                  </Button>
                  {question.userid === user?._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      {t("common.delete")}
                    </Button>
                  )}
                  {user?.isAdmin && question.userid !== user?._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAdminDeleteQuestion}
                      className="text-red-800 hover:text-red-900"
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      {t("question.removeAdmin")}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">
                    {t("home.askedOn", { date: date(question.askedon) })}
                  </span>
                  <Link
                    href={`/users/${question.userid}`}
                    className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm">
                        {question.userposted[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-blue-600 hover:text-blue-800 font-medium">
                        {question.userposted}
                      </div>
                      <UserPlanBadge userId={question.userid} />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">
          {t(
            plural(answerTotal) === "one"
              ? "question.answersCount.one"
              : "question.answersCount.other",
            { count: number(answerTotal) },
          )}
        </h2>
        <div className="space-y-6">
          {question.answer.map((ans: any) => (
            <Card key={ans._id} className={""}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Answer Voting Section */}
                  <div className="flex sm:flex-col items-center sm:items-center p-4 sm:p-6 border-b sm:border-b-0 sm:border-r border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-600 hover:text-orange-500"
                      onClick={() => handleAnswerVote(ans._id, "upvote")}
                    >
                      <ChevronUp className="w-5 h-5" />
                    </Button>
                    <span>
                      {number(
                        (ans.upvote?.length || 0) - (ans.downvote?.length || 0),
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-gray-600 hover:text-orange-500"
                      onClick={() => handleAnswerVote(ans._id, "downvote")}
                    >
                      <ChevronDown className="w-5 h-5" />
                    </Button>
                  </div>
                  {/* Answer Content */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="prose max-w-none mb-6">
                      <div
                        className="text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(ans.answerbody),
                        }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Share className="w-4 h-4 mr-1" />
                          {t("question.share")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleReport("answer", ans._id, question._id)
                          }
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <Flag className="w-4 h-4 mr-1" />
                          {t("question.flag")}
                        </Button>
                        {ans.userid === user?._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteanswer(ans._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            {t("common.delete")}
                          </Button>
                        )}
                        {question.userid === user?._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAcceptAnswer(ans._id)}
                            className={
                              ans.accepted
                                ? "text-green-700 hover:text-green-800"
                                : "text-gray-600 hover:text-gray-800"
                            }
                          >
                            {ans.accepted
                              ? `✓ ${t("question.accepted")}`
                              : t("question.accept")}
                          </Button>
                        )}
                        {user?.isAdmin && ans.userid !== user?._id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdminDeleteAnswer(ans._id)}
                            className="text-red-800 hover:text-red-900"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            {t("question.removeAdmin")}
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                          {t("question.answeredOn", {
                            date: date(ans.answeredon),
                          })}
                        </span>
                        <Link
                          href={`/users/${ans.userid}`}
                          className="flex items-center gap-2 hover:bg-blue-50 p-2 rounded"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm">
                              {ans.useranswered[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-blue-600 hover:text-blue-800 font-medium">
                              {ans.useranswered}
                            </div>
                            <UserPlanBadge userId={ans.userid} />
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            {t("question.yourAnswer")}
          </h3>
          <Textarea
            placeholder={t("question.answerPlaceholder")}
            value={newanswer}
            onChange={(e) => setnewAnswer(e.target.value)}
            className="min-h-32 mb-4 resize-none"
          />
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button
              onClick={handleSubmitanswer}
              disabled={!newanswer.trim() || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? t("question.posting") : t("question.postAnswer")}
            </Button>
            <p className="text-sm text-gray-600">
              {formatWithElements(t("question.agreeNotice"), {
                privacy: (
                  <Link href="#" className="text-blue-600 hover:underline">
                    {t("auth.privacy")}
                  </Link>
                ),
                terms: (
                  <Link href="#" className="text-blue-600 hover:underline">
                    {t("auth.terms")}
                  </Link>
                ),
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionDetail;