import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";

export interface PostComment {
  _id: string;
  post: string;
  author: { _id: string; name: string } | null;
  parent: string | null;
  content: string;
  mentions?: { user: string; username: string }[];
  replyCount?: number;
  createdAt: string;
  editedAt?: string | null;
}

export interface ReplyState {
  items: PostComment[];
  nextCursor: string | null;
  loading: boolean;
  loaded: boolean;
}

export function useComments(postId: string, onCountChange: (delta: number) => void) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, ReplyState>>({});

  useEffect(() => {
    const loadFirstPage = async () => {
      try {
        const res = await axiosInstance.get(`/comment/post/${postId}`);
        setComments(res.data.data);
        setNextCursor(res.data.nextCursor);
      } catch (error) {
        console.log(error);
        toast.error(tr("comments.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    loadFirstPage();
  }, [postId]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await axiosInstance.get(`/comment/post/${postId}`, {
        params: { cursor: nextCursor },
      });
      setComments((prev) => [...prev, ...res.data.data]);
      setNextCursor(res.data.nextCursor);
    } catch (error) {
      console.log(error);
      toast.error(tr("comments.loadMoreFailed"));
    } finally {
      setLoadingMore(false);
    }
  }, [postId, nextCursor, loadingMore]);

  // loads the first page of replies, or the next page if some are already loaded
  const loadReplies = useCallback(
    async (commentId: string) => {
      const current = replies[commentId];
      if (current?.loading) return;

      setReplies((prev) => ({
        ...prev,
        [commentId]: {
          items: current?.items ?? [],
          nextCursor: current?.nextCursor ?? null,
          loaded: current?.loaded ?? false,
          loading: true,
        },
      }));

      try {
        const res = await axiosInstance.get(`/comment/replies/${commentId}`, {
          params: current?.nextCursor ? { cursor: current.nextCursor } : {},
        });
        setReplies((prev) => {
          const existing = prev[commentId]?.items ?? [];
          const known = new Set(existing.map((r) => r._id));
          const fresh = (res.data.data as PostComment[]).filter((r) => !known.has(r._id));
          return {
            ...prev,
            [commentId]: {
              items: [...existing, ...fresh],
              nextCursor: res.data.nextCursor,
              loading: false,
              loaded: true,
            },
          };
        });
      } catch (error) {
        console.log(error);
        setReplies((prev) => ({
          ...prev,
          [commentId]: {
            items: prev[commentId]?.items ?? [],
            nextCursor: prev[commentId]?.nextCursor ?? null,
            loaded: prev[commentId]?.loaded ?? false,
            loading: false,
          },
        }));
        toast.error(tr("comments.repliesFailed"));
      }
    },
    [replies]
  );

  const addComment = useCallback(
    async (content: string, parentId?: string) => {
      try {
        const res = await axiosInstance.post("/comment/create", {
          postId,
          content,
          parentId: parentId ?? null,
        });
        const created: PostComment = res.data.data;
        onCountChange(1);

        if (!parentId) {
          setComments((prev) => [created, ...prev]);
          return true;
        }

        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId ? { ...c, replyCount: (c.replyCount ?? 0) + 1 } : c
          )
        );
        const state = replies[parentId];
        if (!state?.loaded) {
          await loadReplies(parentId); // the fetch includes the reply we just posted
        } else if (state.nextCursor === null) {
          setReplies((prev) => ({
            ...prev,
            [parentId]: { ...prev[parentId], items: [...prev[parentId].items, created] },
          }));
        }
        return true;
      } catch (error: any) {
        toast.error(apiErrorMessage(error, "comments.postFailed"));
        return false;
      }
    },
    [postId, onCountChange, replies, loadReplies]
  );

  const editComment = useCallback(async (comment: PostComment, content: string) => {
    try {
      const res = await axiosInstance.patch(`/comment/update/${comment._id}`, { content });
      const updated: PostComment = res.data.data;
      const parentId = comment.parent;

      if (parentId) {
        setReplies((prev) =>
          prev[parentId]
            ? {
                ...prev,
                [parentId]: {
                  ...prev[parentId],
                  items: prev[parentId].items.map((r) => (r._id === updated._id ? updated : r)),
                },
              }
            : prev
        );
      } else {
        setComments((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      }
      toast.success(tr("comments.updated"));
      return true;
    } catch (error: any) {
      toast.error(apiErrorMessage(error, "comments.updateFailed"));
      return false;
    }
  }, []);

  const removeComment = useCallback(
    async (comment: PostComment) => {
      try {
        const res = await axiosInstance.delete(`/comment/delete/${comment._id}`);
        onCountChange(-(res.data.deletedCount ?? 1));
        const parentId = comment.parent;

        if (parentId) {
          setReplies((prev) =>
            prev[parentId]
              ? {
                  ...prev,
                  [parentId]: {
                    ...prev[parentId],
                    items: prev[parentId].items.filter((r) => r._id !== comment._id),
                  },
                }
              : prev
          );
          setComments((prev) =>
            prev.map((c) =>
              c._id === parentId
                ? { ...c, replyCount: Math.max(0, (c.replyCount ?? 0) - 1) }
                : c
            )
          );
        } else {
          setComments((prev) => prev.filter((c) => c._id !== comment._id));
          setReplies((prev) => {
            const { [comment._id]: _removed, ...rest } = prev;
            return rest;
          });
        }
        toast.success(tr("comments.deleted"));
      } catch (error: any) {
        toast.error(apiErrorMessage(error, "comments.deleteFailed"));
      }
    },
    [onCountChange]
  );

  return {
    comments,
    loading,
    loadingMore,
    hasMore: nextCursor !== null,
    loadMore,
    replies,
    loadReplies,
    addComment,
    editComment,
    removeComment,
  };
}