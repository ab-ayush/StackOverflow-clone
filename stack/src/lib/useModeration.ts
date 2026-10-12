import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";

export interface ReportAuthor {
  _id: string;
  name: string;
  username?: string;
  isAdmin: boolean;
  suspended: boolean;
  removedPostCount: number;
}

export interface ReportGroup {
  postId: string;
  content: string;
  type: string;
  imageCount: number;
  createdAt: string;
  reportCount: number;
  reasonCounts: Record<string, number>;
  notes: string[];
  author: ReportAuthor | null;
}

export interface SuspendedUser {
  _id: string;
  name: string;
  username?: string;
  suspendedAt: string;
  suspensionReason: string;
  removedPostCount: number;
}

export function useModeration(enabled: boolean) {
  const [reports, setReports] = useState<ReportGroup[]>([]);
  const [suspended, setSuspended] = useState<SuspendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadSuspended = useCallback(async () => {
    const res = await axiosInstance.get("/moderation/suspended");
    setSuspended(res.data.data);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const load = async () => {
      try {
        const [queue] = await Promise.all([
          axiosInstance.get("/moderation/reports"),
          loadSuspended(),
        ]);
        setReports(queue.data.data);
      } catch (error) {
        console.log(error);
        toast.error("Could not load the moderation queue");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [enabled, loadSuspended]);

  const run = async (key: string, action: () => Promise<void>, failMessage: string) => {
    setBusyKey(key);
    try {
      await action();
    } catch (error: any) {
      toast.error(error.response?.data?.message || failMessage);
    } finally {
      setBusyKey(null);
    }
  };

  const dismiss = (postId: string) =>
    run(
      `dismiss:${postId}`,
      async () => {
        await axiosInstance.patch(`/moderation/dismiss/${postId}`);
        setReports((prev) => prev.filter((r) => r.postId !== postId));
        toast.success("Reports dismissed");
      },
      "Could not dismiss reports"
    );

  const removePost = (postId: string, reason: string) =>
    run(
      `remove:${postId}`,
      async () => {
        const res = await axiosInstance.delete(`/moderation/post/${postId}`, {
          data: { reason },
        });
        const { authorId, removedPostCount } = res.data;
        setReports((prev) =>
          prev
            .filter((r) => r.postId !== postId)
            .map((r) =>
              r.author && r.author._id === authorId
                ? { ...r, author: { ...r.author, removedPostCount } }
                : r
            )
        );
        toast.success("Post removed");
      },
      "Could not remove the post"
    );

  const suspend = (userId: string, reason: string) =>
    run(
      `suspend:${userId}`,
      async () => {
        await axiosInstance.patch(`/moderation/suspend/${userId}`, { reason });
        setReports((prev) =>
          prev.map((r) =>
            r.author && r.author._id === userId
              ? { ...r, author: { ...r.author, suspended: true } }
              : r
          )
        );
        await loadSuspended();
        toast.success("User suspended");
      },
      "Could not suspend the user"
    );

  const unsuspend = (userId: string) =>
    run(
      `unsuspend:${userId}`,
      async () => {
        await axiosInstance.patch(`/moderation/unsuspend/${userId}`);
        setSuspended((prev) => prev.filter((u) => u._id !== userId));
        setReports((prev) =>
          prev.map((r) =>
            r.author && r.author._id === userId
              ? { ...r, author: { ...r.author, suspended: false } }
              : r
          )
        );
        toast.success("Suspension lifted");
      },
      "Could not lift the suspension"
    );

  return { reports, suspended, loading, busyKey, dismiss, removePost, suspend, unsuspend };
}