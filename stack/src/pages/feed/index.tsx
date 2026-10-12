import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import FeedList from "@/src/components/FeedList";
import PopularTags from "@/src/components/PopularTags";
import { useRouter } from "next/router";

type Tab = "explore" | "trending" | "following";

const FeedPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("explore");

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (router.isReady && router.query.tab === "trending") setTab("trending");
  }, [router.isReady, router.query.tab]);

  const loggedIn = mounted && !!user;
  // the Following tab only exists for logged-in users
  const activeScope: Tab = tab === "following" && !loggedIn ? "explore" : tab;

  const tabClass = (name: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1 ${
      activeScope === name
        ? "border-blue-600 text-blue-600"
        : "border-transparent text-gray-600 hover:text-gray-900"
    }`;

  return (
    <Mainlayout>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
          Community Feed
        </h1>

        <PopularTags />

        <div className="flex gap-2 border-b">
          <button className={tabClass("explore")} onClick={() => setTab("explore")}>
            Explore
          </button>
          <button className={tabClass("trending")} onClick={() => setTab("trending")}>
            <Flame className="w-4 h-4" />
            Trending
          </button>
          {loggedIn && (
            <button className={tabClass("following")} onClick={() => setTab("following")}>
              Following
            </button>
          )}
        </div>

        <FeedList key={activeScope} scope={activeScope} />
      </div>
    </Mainlayout>
  );
};

export default FeedPage;