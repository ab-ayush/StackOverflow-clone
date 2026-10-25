import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";

export interface SessionInfo {
  id: string;
  browser: string;
  os: string;
  deviceType: string;
  ip: string;
  location: { city: string | null; region: string | null; country: string | null };
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/session/mine");
      setSessions(res.data.data);
    } catch (error) {
      toast.error(apiErrorMessage(error, "sessions.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  const revoke = useCallback(async (sessionId: string) => {
    try {
      await axiosInstance.delete(`/session/${sessionId}`);
      toast.success(tr("sessions.revoked"));
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (error) {
      toast.error(apiErrorMessage(error, "sessions.revokeFailed"));
    }
  }, []);

  const revokeAllOthers = useCallback(async () => {
    try {
      await axiosInstance.delete("/session");
      toast.success(tr("sessions.revokedAll"));
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch (error) {
      toast.error(apiErrorMessage(error, "sessions.revokeAllFailed"));
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, revoke, revokeAllOthers, refetch: fetchSessions };
}