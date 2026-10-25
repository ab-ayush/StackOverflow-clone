import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { useAuth } from "@/src/lib/AuthContext";
import { useFeed } from "@/src/lib/useFeed";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { formatWithElements } from "@/src/i18n/format";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";
import FeedSkeleton from "./FeedSkeleton";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger";
import { Card, CardContent } from "./ui/card";

interface FeedListProps {
  scope?: "explore" | "following" | "trending";
  endpoint?: string;
  showComposer?: boolean;
  emptyMessage?: string;
}

export default function FeedList({
  scope = "explore",
  endpoint,
  showComposer = true,
  emptyMessage,
}: FeedListProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const {
    posts,
    loading,
    loadingMore,
    loadMoreFailed,
    hasMore,
    loadMore,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    toggleBookmark,
    sharePost,
    changeCommentCount,
    toggleFollow,
  } = useFeed({ scope, endpoint });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTrending = scope === "trending";

  const defaultEmpty = isTrending
    ? t("feed.empty.trending")
    : scope === "following"
    ? t("feed.empty.following")
    : t("feed.empty.explore");

  return (
    <div className="space-y-4">
      {showComposer &&
        !isTrending &&
        mounted &&
        (user ? (
          <PostComposer onSubmit={createPost} />
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-gray-600">
              {formatWithElements(t("feed.loginToPost"), {
                login: (
                  <Link href="/auth" className="text-blue-600 hover:underline">
                    {t("nav.login")}
                  </Link>
                ),
              })}
            </CardContent>
          </Card>
        ))}

      {loading ? (
        <FeedSkeleton />
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage ?? defaultEmpty}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            // content-visibility: the browser skips layout and painting for posts far off-screen
            <div
              key={post._id}
              className="space-y-1 [content-visibility:auto] [contain-intrinsic-size:auto_340px]"
            >
              {isTrending && (
                <div className="flex items-center gap-1 px-1 text-xs font-medium text-orange-600">
                  <Flame className="w-3.5 h-3.5" />
                  {t("feed.trendingRank", { rank: index + 1 })}
                </div>
              )}
              <PostCard
                post={post}
                isOwner={!!user && post.author?._id === user._id}
                onLike={toggleLike}
                onBookmark={toggleBookmark}
                onShare={sharePost}
                onCommentCountChange={changeCommentCount}
                onFollow={toggleFollow}
                onUpdate={updatePost}
                onDelete={deletePost}
              />
            </div>
          ))}
        </div>
      )}

      <InfiniteScrollTrigger
        hasMore={hasMore}
        loading={loadingMore}
        failed={loadMoreFailed}
        onLoadMore={loadMore}
      />

      {!isTrending && !hasMore && posts.length > 0 && (
        <p className="text-center text-sm text-gray-400 pb-6">{t("feed.caughtUp")}</p>
      )}
    </div>
  );
}