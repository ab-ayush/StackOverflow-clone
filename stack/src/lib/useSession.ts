import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";

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
      toast.error("Could not load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  const revoke = useCallback(
    async (sessionId: string) => {
      try {
        await axiosInstance.delete(`/session/${sessionId}`);
        toast.success("Session revoked");
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } catch (error) {
        toast.error("Failed to revoke session");
      }
    },
    []
  );

  const revokeAllOthers = useCallback(async () => {
    try {
      await axiosInstance.delete("/session");
      toast.success("Logged out of all other devices");
      setSessions((prev) => prev.filter((s) => s.isCurrent));
    } catch (error) {
      toast.error("Failed to revoke sessions");
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, revoke, revokeAllOthers, refetch: fetchSessions };
}