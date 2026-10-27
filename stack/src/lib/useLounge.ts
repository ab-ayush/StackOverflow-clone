import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";

export interface LoungeMessage {
  _id: string;
  content: string;
  createdAt: string;
  author: { _id: string; name: string; username?: string } | null;
}

export interface LoungeMember {
  _id: string;
  name: string;
  username?: string;
}

const POLL_MS = 15 * 1000;

// combines two lists of messages without duplicates, oldest first
const merge = (current: LoungeMessage[], incoming: LoungeMessage[]) => {
  const byId = new Map<string, LoungeMessage>();
  current.concat(incoming).forEach((message) => byId.set(message._id, message));
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

export function useLounge(enabled: boolean) {
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [members, setMembers] = useState<LoungeMember[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [posting, setPosting] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const loadLatest = useCallback(async (first: boolean) => {
    try {
      const res = await axiosInstance.get("/lounge");
      setMessages((prev) => merge(prev, res.data.data));
      if (first) setHasMore(res.data.hasMore);
    } catch (error: any) {
      if (error?.response?.data?.code === "PLAN_REQUIRED") setLocked(true);
      else if (first) toast.error(apiErrorMessage(error, "lounge.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/lounge/members");
      setMembers(res.data.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    loadLatest(true);
    loadMembers();
    // new messages from other members appear without reloading the page
    const timer = setInterval(() => {
      if (!document.hidden) loadLatest(false);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [enabled, loadLatest, loadMembers]);

  const loadOlder = useCallback(async () => {
    if (!messages.length || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await axiosInstance.get("/lounge", {
        params: { before: messages[0].createdAt },
      });
      setMessages((prev) => merge(prev, res.data.data));
      setHasMore(res.data.hasMore);
    } catch (error) {
      toast.error(apiErrorMessage(error, "lounge.loadFailed"));
    } finally {
      setLoadingOlder(false);
    }
  }, [messages, loadingOlder]);

  const post = useCallback(async (content: string) => {
    setPosting(true);
    try {
      const res = await axiosInstance.post("/lounge", { content });
      setMessages((prev) => merge(prev, [res.data.data]));
      return true;
    } catch (error) {
      toast.error(apiErrorMessage(error, "lounge.postFailed"));
      return false;
    } finally {
      setPosting(false);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await axiosInstance.delete(`/lounge/${id}`);
      setMessages((prev) => prev.filter((message) => message._id !== id));
    } catch (error) {
      toast.error(apiErrorMessage(error, "lounge.deleteFailed"));
    }
  }, []);

  return {
    messages,
    members,
    hasMore,
    loading,
    locked,
    posting,
    loadingOlder,
    loadOlder,
    post,
    remove,
  };
}