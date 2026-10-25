import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";
import type { TranslationKey } from "@/src/i18n/translate";

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
        toast.error(tr("moderation.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [enabled, loadSuspended]);

  const run = async (key: string, action: () => Promise<void>, failKey: TranslationKey) => {
    setBusyKey(key);
    try {
      await action();
    } catch (error: any) {
      toast.error(apiErrorMessage(error, failKey));
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
        toast.success(tr("moderation.dismissed"));
      },
      "moderation.dismissFailed"
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
        toast.success(tr("moderation.removed"));
      },
      "moderation.removeFailed"
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
        toast.success(tr("moderation.suspended"));
      },
      "moderation.suspendFailed"
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
        toast.success(tr("moderation.unsuspended"));
      },
      "moderation.unsuspendFailed"
    );

  return { reports, suspended, loading, busyKey, dismiss, removePost, suspend, unsuspend };
}