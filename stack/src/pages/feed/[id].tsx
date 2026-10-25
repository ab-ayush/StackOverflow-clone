import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Mainlayout from "@/src/layout/Mainlayout";
import axiosInstance from "@/src/lib/axiosinstance";
import { Post } from "@/src/lib/useFeed";
import { usePostInteractions } from "@/src/lib/usePostInteractions";
import { useLanguage } from "@/src/i18n/LanguageContext";
import PostCard from "@/src/components/PostCard";

const SinglePostPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = router.query;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { toggleLike, toggleBookmark, sharePost, changeCommentCount } =
    usePostInteractions(setPosts);

  useEffect(() => {
    if (typeof id !== "string") return;
    const loadPost = async () => {
      try {
        const res = await axiosInstance.get(`/post/${id}`);
        setPosts([res.data.data]);
      } catch (error) {
        console.log(error);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [id]);

  return (
    <Mainlayout>
      <div className="max-w-2xl space-y-4">
        <Link href="/feed" className="text-sm text-blue-600 hover:underline">
          ← {t("feed.backToFeed")}
        </Link>

        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto" />
        ) : failed || posts.length === 0 ? (
          <p className="text-sm text-gray-500">{t("feed.postMissing")}</p>
        ) : (
          <PostCard
            post={posts[0]}
            isOwner={false}
            onLike={toggleLike}
            onBookmark={toggleBookmark}
            onShare={sharePost}
            onCommentCountChange={changeCommentCount}
            defaultShowComments
          />
        )}
      </div>
    </Mainlayout>
  );
};

export default SinglePostPage;