import Link from "next/link";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { useFeed } from "@/src/lib/useFeed";
import PostCard from "@/src/components/PostCard";
import FeedSkeleton from "@/src/components/FeedSkeleton";
import InfiniteScrollTrigger from "@/src/components/InfiniteScrollTrigger";

const SavedPage = () => {
  const { user } = useAuth();
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
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Saved posts</h1>

        {loading ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven't saved any posts yet. Tap the bookmark icon on a post in the{" "}
            <Link href="/feed" className="text-blue-600 hover:underline">
              feed
            </Link>{" "}
            to keep it here.
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