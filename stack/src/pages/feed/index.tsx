import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Flame } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { useLanguage } from "@/src/i18n/LanguageContext";
import FeedList from "@/src/components/FeedList";
import PopularTags from "@/src/components/PopularTags";

type Tab = "explore" | "trending" | "following";

const FeedPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("explore");

  useEffect(() => {
    setMounted(true);
  }, []);

  // the "See all trending" link in the right sidebar opens /feed?tab=trending
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
          {t("feed.heading")}
        </h1>

        <PopularTags />

        <div className="flex gap-2 border-b">
          <button className={tabClass("explore")} onClick={() => setTab("explore")}>
            {t("feed.tab.explore")}
          </button>
          <button className={tabClass("trending")} onClick={() => setTab("trending")}>
            <Flame className="w-4 h-4" />
            {t("feed.tab.trending")}
          </button>
          {loggedIn && (
            <button className={tabClass("following")} onClick={() => setTab("following")}>
              {t("feed.tab.following")}
            </button>
          )}
        </div>

        <FeedList key={activeScope} scope={activeScope} />
      </div>
    </Mainlayout>
  );
};

export default FeedPage;