import { useState } from "react";
import { useReputationTransfer } from "@/src/lib/useReputationTransfer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/src/lib/AuthContext";

export default function ReputationTransfer() {
  const { user } = useAuth();
  const { history, loading, sending, sendTransfer } = useReputationTransfer();
  const [receiverId, setReceiverId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!receiverId.trim() || !amt || !reason.trim()) return;
    const success = await sendTransfer(receiverId.trim(), amt, reason.trim());
    if (success) {
      setReceiverId("");
      setAmount("");
      setReason("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Reputation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <Label htmlFor="receiverId">Recipient User ID</Label>
            <Input
              id="receiverId"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder="Paste the recipient's user ID"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (max 50 per transaction)</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              max={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you sending this?"
            />
          </div>
          <Button type="submit" disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            {sending ? "Sending..." : "Send"}
          </Button>
          {user && (
            <p className="text-xs text-gray-500">
              Requires more than 50 reputation to send. Daily limit: 100 points.
            </p>
          )}
        </form>

        <div>
          <h4 className="text-sm font-semibold mb-2">Transaction History</h4>
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">No transfers yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {history.map((t) => {
                const isSent = t.sender._id === user?._id;
                return (
                  <div key={t._id} className="text-sm border-b pb-2">
                    <div className="flex justify-between">
                      <span>
                        {isSent ? "To " : "From "}
                        <span className="font-medium">
                          {isSent ? t.receiver.name : t.sender.name}
                        </span>
                      </span>
                      <span
                        className={
                          isSent ? "text-red-700 font-medium" : "text-green-700 font-medium"
                        }
                      >
                        {isSent ? "-" : "+"}
                        {t.amount}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{t.reason}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}