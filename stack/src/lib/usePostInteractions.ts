import { useCallback, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import axiosInstance from "./axiosinstance";
import { useAuth } from "./AuthContext";
import { tr, apiErrorMessage } from "@/src/i18n/runtime";
import type { Post } from "./useFeed";

type SetPosts = Dispatch<SetStateAction<Post[]>>;

const flipLike = (p: Post): Post => ({
  ...p,
  likedByMe: !p.likedByMe,
  likeCount: Math.max(0, (p.likeCount ?? 0) + (p.likedByMe ? -1 : 1)),
});

const flipBookmark = (p: Post): Post => ({ ...p, bookmarkedByMe: !p.bookmarkedByMe });

export function usePostInteractions(
  setPosts: SetPosts,
  options: { removeOnUnbookmark?: boolean } = {}
) {
  const { user } = useAuth();
  const router = useRouter();
  const pending = useRef<Set<string>>(new Set()); // ignores clicks while a request is in flight
  const removeOnUnbookmark = options.removeOnUnbookmark ?? false;

  const patchPost = useCallback(
    (id: string, changes: Partial<Post>) => {
      setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, ...changes } : p)));
    },
    [setPosts]
  );

  const requireLogin = useCallback(() => {
    if (!user) {
      toast.info(tr("common.loginRequired"));
      router.push("/auth");
      return false;
    }
    return true;
  }, [user, router]);

  const toggleLike = useCallback(
    async (id: string) => {
      if (!requireLogin()) return;
      const key = `like:${id}`;
      if (pending.current.has(key)) return;
      pending.current.add(key);

      setPosts((prev) => prev.map((p) => (p._id === id ? flipLike(p) : p)));
      try {
        const res = await axiosInstance.patch(`/post/like/${id}`);
        patchPost(id, { likedByMe: res.data.liked, likeCount: res.data.likeCount });
      } catch (error) {
        setPosts((prev) => prev.map((p) => (p._id === id ? flipLike(p) : p))); // undo
        toast.error(apiErrorMessage(error, "post.likeFailed"));
      } finally {
        pending.current.delete(key);
      }
    },
    [requireLogin, setPosts, patchPost]
  );

  const toggleBookmark = useCallback(
    async (id: string) => {
      if (!requireLogin()) return;
      const key = `bookmark:${id}`;
      if (pending.current.has(key)) return;
      pending.current.add(key);

      setPosts((prev) => prev.map((p) => (p._id === id ? flipBookmark(p) : p)));
      try {
        const res = await axiosInstance.patch(`/post/bookmark/${id}`);
        if (!res.data.bookmarked && removeOnUnbookmark) {
          setPosts((prev) => prev.filter((p) => p._id !== id));
        } else {
          patchPost(id, { bookmarkedByMe: res.data.bookmarked });
        }
        toast.success(
          res.data.bookmarked ? tr("post.bookmarkSaved") : tr("post.bookmarkRemoved")
        );
      } catch (error) {
        setPosts((prev) => prev.map((p) => (p._id === id ? flipBookmark(p) : p))); // undo
        toast.error(apiErrorMessage(error, "post.bookmarkFailed"));
      } finally {
        pending.current.delete(key);
      }
    },
    [requireLogin, setPosts, patchPost, removeOnUnbookmark]
  );

  const sharePost = useCallback(
    async (id: string) => {
      const link = `${window.location.origin}/feed/${id}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success(tr("post.linkCopied"));
      } catch {
        window.prompt(tr("post.copyPrompt"), link);
      }

      if (!user) return; // anyone can copy the link, only logged-in shares are counted
      try {
        const res = await axiosInstance.post(`/post/share/${id}`);
        patchPost(id, { shareCount: res.data.shareCount });
      } catch (error) {
        console.log(error);
      }
    },
    [user, patchPost]
  );

  const changeCommentCount = useCallback(
    (id: string, delta: number) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 0) + delta) }
            : p
        )
      );
    },
    [setPosts]
  );

  const toggleFollow = useCallback(
    async (authorId: string) => {
      if (!requireLogin()) return;
      const key = `follow:${authorId}`;
      if (pending.current.has(key)) return;
      pending.current.add(key);

      const flipAll = () =>
        setPosts((prev) =>
          prev.map((p) =>
            p.author?._id === authorId ? { ...p, followingAuthor: !p.followingAuthor } : p
          )
        );

      flipAll();
      try {
        const res = await axiosInstance.patch(`/follow/toggle/${authorId}`);
        setPosts((prev) =>
          prev.map((p) =>
            p.author?._id === authorId ? { ...p, followingAuthor: res.data.following } : p
          )
        );
        toast.success(res.data.following ? tr("post.followed") : tr("post.unfollowed"));
      } catch (error: any) {
        flipAll(); // undo
        toast.error(apiErrorMessage(error, "post.followFailed"));
      } finally {
        pending.current.delete(key);
      }
    },
    [requireLogin, setPosts]
  );

  return { toggleLike, toggleBookmark, sharePost, changeCommentCount, toggleFollow };
}