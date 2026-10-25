import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Flame, Heart, MessageCircle } from "lucide-react";
import { Post } from "@/src/lib/useFeed";
import { useLanguage } from "@/src/i18n/LanguageContext";

const TrendingNow = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // plain axios on purpose: anonymous, so this can never trigger the login redirect
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/post/trending`);
        if (!cancelled) setPosts((res.data.data as Post[]).slice(0, 5));
      } catch (error) {
        console.log(error);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // nothing is trending yet (or the request failed): don't show an empty card
  if (loaded && posts.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded p-3 lg:p-4">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base flex items-center gap-1.5">
        <Flame className="w-4 h-4 text-orange-500" />
        {t("trending.title")}
      </h3>

      {!loaded ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <ul className="space-y-1">
            {posts.map((post, index) => (
              <li key={post._id}>
                <Link
                  href={`/feed/${post._id}`}
                  className="flex gap-2 rounded px-1 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-orange-500 font-semibold text-xs lg:text-sm w-4 shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-gray-800 text-xs lg:text-sm line-clamp-2 break-words">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                      <span className="font-medium text-gray-600 truncate max-w-[110px]">
                        {post.author?.name ?? t("trending.unknownUser")}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <Heart className="w-3 h-3" />
                        {post.likeCount ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3" />
                        {post.commentCount ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/feed?tab=trending"
            className="block mt-2 text-xs text-blue-600 hover:underline"
          >
            {t("trending.seeAll")} →
          </Link>
        </>
      )}
    </div>
  );
};

export default TrendingNow;