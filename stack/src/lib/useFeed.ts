import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosinstance";
import { toast } from "react-toastify";
import { usePostInteractions } from "./usePostInteractions";

export type PostType = "update" | "snippet" | "showcase" | "achievement";

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface Post {
  _id: string;
  author: { _id: string; name: string; username?: string } | null;
  type: PostType;
  content: string;
  codeSnippet?: CodeSnippet | null;
  images?: string[];
  hashtags?: string[];
  mentions?: { user: string; username: string }[];
  likeCount?: number;
  shareCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  bookmarkedByMe?: boolean;
  followingAuthor?: boolean;
  createdAt: string;
  editedAt?: string | null;
}

export interface PostInput {
  content: string;
  type: PostType;
  codeSnippet: CodeSnippet | null;
  newImages: File[];
  keepImages?: string[]; // only sent when editing
}

interface UseFeedOptions {
  endpoint?: string; // "/post/feed" (default) or "/post/bookmarks"
  scope?: "explore" | "following" | "trending";
  removeOnUnbookmark?: boolean; // used by the Saved page
}

const toFormData = (input: PostInput) => {
  const fd = new FormData();
  fd.append("content", input.content);
  fd.append("type", input.type);
  fd.append("codeSnippet", JSON.stringify(input.codeSnippet));
  if (input.keepImages) {
    fd.append("keepImages", JSON.stringify(input.keepImages));
  }
  input.newImages.forEach((file) => fd.append("images", file));
  return fd;
};

export function useFeed(options: UseFeedOptions = {}) {
  const { endpoint = "/post/feed", scope = "explore", removeOnUnbookmark = false } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { toggleLike, toggleBookmark, sharePost, changeCommentCount, toggleFollow } =
    usePostInteractions(setPosts, { removeOnUnbookmark });

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const params: Record<string, string> = {};
      if (scope === "following") params.scope = "following";
      if (cursor) params.cursor = cursor;
      const url = scope === "trending" ? "/post/trending" : endpoint;
      const res = await axiosInstance.get(url, { params });
      return res.data as { data: Post[]; nextCursor: string | null };
    },
    [endpoint, scope]
  );

  useEffect(() => {
    const loadFirstPage = async () => {
      try {
        const page = await fetchPage(null);
        setPosts(page.data);
        setNextCursor(page.nextCursor);
      } catch (error) {
        console.log(error);
        toast.error("Could not load posts");
      } finally {
        setLoading(false);
      }
    };
    loadFirstPage();
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    try {
      const page = await fetchPage(nextCursor);
      // skip anything already shown, in case a post moved between pages
      setPosts((prev) => {
        const known = new Set(prev.map((p) => p._id));
        return [...prev, ...page.data.filter((p) => !known.has(p._id))];
      });
      setNextCursor(page.nextCursor);
    } catch (error) {
      console.log(error);
      setLoadMoreFailed(true);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, fetchPage]);

  const createPost = useCallback(async (input: PostInput) => {
    try {
      const res = await axiosInstance.post("/post/create", toFormData(input));
      setPosts((prev) => [res.data.data, ...prev]);
      toast.success("Post published");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to publish post");
      return false;
    }
  }, []);

  const updatePost = useCallback(async (id: string, input: PostInput) => {
    try {
      const res = await axiosInstance.patch(`/post/update/${id}`, toFormData(input));
      setPosts((prev) => prev.map((p) => (p._id === id ? res.data.data : p)));
      toast.success("Post updated");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update post");
      return false;
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    try {
      await axiosInstance.delete(`/post/delete/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Post deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    loadMoreFailed,
    hasMore: nextCursor !== null,
    loadMore,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleBookmark,
    sharePost,
    changeCommentCount,
    toggleFollow,
  };
}