import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";
import type { PlanId } from "./plans";

export interface Ticket {
  _id: string;
  number: string;
  subject: string;
  message: string;
  plan: PlanId;
  priority: number;
  status: "open" | "closed";
  adminReply: string;
  repliedAt: string | null;
  createdAt: string;
  user?: { _id: string; name: string; username?: string; email: string } | null;
}

export function useMyTickets(enabled: boolean) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const load = async () => {
      try {
        const res = await axiosInstance.get("/support/mine");
        setTickets(res.data.data);
      } catch (error) {
        console.log(error);
        toast.error(tr("support.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [enabled]);

  const create = useCallback(async (subject: string, message: string) => {
    setSending(true);
    try {
      const res = await axiosInstance.post("/support", { subject, message });
      setTickets((prev) => [res.data.data, ...prev]);
      toast.success(tr("support.sent", { number: res.data.data.number }));
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error, "support.sendFailed"));
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  return { tickets, loading, sending, create };
}

export function useSupportInbox(enabled: boolean, status: "open" | "closed") {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/support/admin/all", { params: { status } });
        if (!cancelled) setTickets(res.data.data);
      } catch (error) {
        console.log(error);
        if (!cancelled) toast.error(tr("supportAdmin.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, status]);

  const reply = useCallback(async (id: string, text: string) => {
    setBusyId(id);
    try {
      await axiosInstance.patch(`/support/admin/${id}/reply`, { reply: text });
      // an answered ticket leaves the open list
      setTickets((prev) => prev.filter((ticket) => ticket._id !== id));
      toast.success(tr("supportAdmin.replied"));
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error, "supportAdmin.replyFailed"));
      return false;
    } finally {
      setBusyId(null);
    }
  }, []);

  return { tickets, loading, busyId, reply };
}