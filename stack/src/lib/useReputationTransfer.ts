import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";

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
        const res = await axiosInstance.post("/reputation-transfer/send", {
          receiverId,
          amount,
          reason,
        });
        toast.success(res.data.message || "Transfer successful");
        await fetchHistory();
        return true;
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Transfer failed");
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