import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import TrendingNow from "./TrendingNow";
import FeaturedMembers from "./FeaturedMembers";
import { useAuth } from "@/src/lib/AuthContext";
import { useSubscription } from "@/src/lib/useSubscription";
import { useLanguage } from "@/src/i18n/LanguageContext";

const RightSideBar = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mine } = useSubscription();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // visitors and Free accounts see the upgrade card; paid plans do not
  const showUpgrade = mounted && (!user || mine?.plan === "free");

  return (
    // built like the left sidebar: the wrapper is as tall as the page, so the border runs full height,
    // and the content inside stays in view while the page scrolls
    <div className="hidden shrink-0 border-l bg-white lg:block">
      <aside className="sticky top-0 max-h-screen w-64 overflow-y-auto p-4 xl:w-80 xl:p-5">
        <div className="space-y-4">
          {showUpgrade && (
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 p-4 text-white shadow-md shadow-blue-600/20">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                {t("pricing.title")}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-blue-50">
                {t("pricing.subtitle")}
              </p>
              <Link
                href="/pricing"
                className="mt-3 inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 active:scale-95"
              >
                {t("limits.upgradeCta")}
              </Link>
            </div>
          )}

          <TrendingNow />
          <FeaturedMembers />
        </div>
      </aside>
    </div>
  );
};

export default RightSideBar;
