import { useReputationLog } from "@/src/lib/useReputation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import type { TranslationKey } from "@/src/i18n/translate";

const reasonKeys: Record<string, TranslationKey> = {
  answer_posted: "reputation.reason.answer_posted",
  answer_deleted: "reputation.reason.answer_deleted",
  answer_accepted: "reputation.reason.answer_accepted",
  answer_accept_revoked: "reputation.reason.answer_accept_revoked",
  answer_5_upvotes: "reputation.reason.answer_5_upvotes",
  question_downvoted: "reputation.reason.question_downvoted",
  question_downvote_removed: "reputation.reason.question_downvote_removed",
  question_10_upvotes: "reputation.reason.question_10_upvotes",
  profile_completed: "reputation.reason.profile_completed",
  admin_removed_question: "reputation.reason.admin_removed_question",
  admin_removed_answer: "reputation.reason.admin_removed_answer",
  admin_removed_post: "reputation.reason.admin_removed_post",
  reputation_transfer_sent: "reputation.reason.reputation_transfer_sent",
  reputation_transfer_received: "reputation.reason.reputation_transfer_received",
};

export default function ReputationActivity({ userId }: { userId: string }) {
  const { t } = useLanguage();
  const { date, number } = useFormatters();
  const { logs, loading } = useReputationLog(userId);

  const reasonText = (reason: string) => {
    const key = reasonKeys[reason];
    return key ? t(key) : reason;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("reputation.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">{t("common.loading")}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">{t("reputation.empty")}</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between text-sm border-b pb-2"
              >
                <span className="text-gray-700">{reasonText(log.reason)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{date(log.createdAt)}</span>
                  <span
                    className={
                      log.amount >= 0
                        ? "text-green-700 font-medium"
                        : "text-red-700 font-medium"
                    }
                  >
                    {log.amount >= 0 ? "+" : ""}
                    {number(log.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}