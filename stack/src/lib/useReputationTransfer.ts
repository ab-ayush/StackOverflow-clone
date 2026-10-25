import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";

export interface Transfer {
  _id: string;
  sender: { _id: string; name: string; email: string };
  receiver: { _id: string; name: string; email: string };
  amount: number;
  reason: string;
  createdAt: string;
}

export function useReputationTransfer() {
  const [history, setHistory] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/reputation-transfer/history");
      setHistory(res.data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTransfer = useCallback(
    async (receiverId: string, amount: number, reason: string) => {
      setSending(true);
      try {
        await axiosInstance.post("/reputation-transfer/send", {
          receiverId,
          amount,
          reason,
        });
        toast.success(tr("transfer.success"));
        await fetchHistory();
        return true;
      } catch (error: any) {
        toast.error(apiErrorMessage(error, "transfer.failed"));
        return false;
      } finally {
        setSending(false);
      }
    },
    [fetchHistory]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, sending, sendTransfer };
}