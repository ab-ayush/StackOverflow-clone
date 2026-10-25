import Link from "next/link";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { useFeed } from "@/src/lib/useFeed";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { formatWithElements } from "@/src/i18n/format";
import PostCard from "@/src/components/PostCard";
import FeedSkeleton from "@/src/components/FeedSkeleton";
import InfiniteScrollTrigger from "@/src/components/InfiniteScrollTrigger";

const SavedPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const {
    posts,
    loading,
    loadingMore,
    loadMoreFailed,
    hasMore,
    loadMore,
    updatePost,
    deletePost,
    toggleLike,
    toggleBookmark,
    sharePost,
    changeCommentCount,
    toggleFollow,
  } = useFeed({ endpoint: "/post/bookmarks", removeOnUnbookmark: true });

  return (
    <Mainlayout>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
          {t("saved.heading")}
        </h1>

        {loading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-500">
            {formatWithElements(t("saved.empty"), {
              feed: (
                <Link href="/feed" className="text-blue-600 hover:underline">
                  {t("saved.feedLink")}
                </Link>
              ),
            })}
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post._id}
                className="[content-visibility:auto] [contain-intrinsic-size:auto_340px]"
              >
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
      </div>
    </Mainlayout>
  );
};

export default SavedPage;