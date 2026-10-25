import { useState } from "react";
import { useReputationTransfer } from "@/src/lib/useReputationTransfer";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/src/lib/AuthContext";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { formatWithElements } from "@/src/i18n/format";

export default function ReputationTransfer() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { dateTime, number } = useFormatters();
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
        <CardTitle>{t("transfer.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSend} className="space-y-3">
          <div>
            <Label htmlFor="receiverId">{t("transfer.recipientLabel")}</Label>
            <Input
              id="receiverId"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              placeholder={t("transfer.recipientPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="amount">{t("transfer.amountLabel")}</Label>
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
            <Label htmlFor="reason">{t("transfer.reasonLabel")}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("transfer.reasonPlaceholder")}
            />
          </div>
          <Button type="submit" disabled={sending} className="bg-blue-600 hover:bg-blue-700">
            {sending ? t("transfer.sending") : t("transfer.send")}
          </Button>
          {user && <p className="text-xs text-gray-500">{t("transfer.note")}</p>}
        </form>

        <div>
          <h4 className="text-sm font-semibold mb-2">{t("transfer.history")}</h4>
          {loading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">{t("transfer.none")}</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {history.map((item) => {
                const isSent = item.sender._id === user?._id;
                return (
                  <div key={item._id} className="text-sm border-b pb-2">
                    <div className="flex justify-between">
                      <span>
                        {formatWithElements(t(isSent ? "transfer.to" : "transfer.from"), {
                          name: (
                            <span className="font-medium">
                              {isSent ? item.receiver.name : item.sender.name}
                            </span>
                          ),
                        })}
                      </span>
                      <span
                        className={
                          isSent ? "text-red-700 font-medium" : "text-green-700 font-medium"
                        }
                      >
                        {isSent ? "-" : "+"}
                        {number(item.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{item.reason}</p>
                    <p className="text-xs text-gray-400">{dateTime(item.createdAt)}</p>
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