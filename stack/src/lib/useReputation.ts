import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosinstance";

export interface ReputationLogEntry {
  _id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export function useReputationLog(userId: string | undefined) {
  const [logs, setLogs] = useState<ReputationLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/reputation/log/${userId}`);
        setLogs(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [userId]);

  return { logs, loading };
}