import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { NOTIFICATIONS_CHANGED } from "./useUnreadCount";

export type NotificationType = "like" | "comment" | "reply" | "mention" | "follow";

export interface NotificationItem {
  _id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: { _id: string; name: string; username?: string };
  postId: string | null;
  onComment: boolean;
  preview: string | null;
}

const announceChange = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));

export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const load = async () => {
      try {
        const res = await axiosInstance.get("/notification");
        setItems(res.data.data);
        setNextCursor(res.data.nextCursor);
      } catch (error) {
        console.log(error);
        toast.error("Could not load notifications");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [enabled]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await axiosInstance.get("/notification", { params: { cursor: nextCursor } });
      setItems((prev) => [...prev, ...res.data.data]);
      setNextCursor(res.data.nextCursor);
    } catch (error) {
      console.log(error);
      toast.error("Could not load more notifications");
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const markRead = useCallback(
    async (id: string) => {
      const target = items.find((n) => n._id === id);
      if (!target || target.read) return;
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      try {
        await axiosInstance.patch(`/notification/read/${id}`);
        announceChange();
      } catch (error) {
        console.log(error);
      }
    },
    [items]
  );

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await axiosInstance.patch("/notification/read-all");
      announceChange();
    } catch (error) {
      console.log(error);
      toast.error("Could not mark all as read");
    }
  }, []);

  return {
    items,
    loading,
    loadingMore,
    hasMore: nextCursor !== null,
    loadMore,
    markRead,
    markAllRead,
  };
}