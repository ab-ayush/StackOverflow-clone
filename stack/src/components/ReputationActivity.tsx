import { useReputationLog } from "@/src/lib/useReputation";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function ReputationActivity({ userId }: { userId: string }) {
  const { logs, loading } = useReputationLog(userId);

  const reasonLabels: Record<string, string> = {
    answer_posted: "Posted an answer",
    answer_deleted: "Deleted an answer",
    answer_accepted: "Answer was accepted",
    answer_accept_revoked: "Answer acceptance revoked",
    answer_5_upvotes: "Answer reached 5 upvotes",
    question_downvoted: "Question was downvoted",
    question_downvote_removed: "Downvote removed from question",
    question_10_upvotes: "Question reached 10 upvotes",
    profile_completed: "Completed profile",
    admin_removed_question: "Question removed by admin",
    admin_removed_answer: "Answer removed by admin",
    reputation_transfer_sent: "Sent reputation to another user",
    reputation_transfer_received: "Received reputation from another user",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reputation Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500">No reputation activity yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between text-sm border-b pb-2"
              >
                <span className="text-gray-700">
                  {reasonLabels[log.reason] || log.reason}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={
                      log.amount >= 0
                        ? "text-green-700 font-medium"
                        : "text-red-700 font-medium"
                    }
                  >
                    {log.amount >= 0 ? "+" : ""}
                    {log.amount}
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