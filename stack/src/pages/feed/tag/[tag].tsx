import Link from "next/link";
import { useRouter } from "next/router";
import Mainlayout from "@/src/layout/Mainlayout";
import FeedList from "@/src/components/FeedList";
import { useLanguage } from "@/src/i18n/LanguageContext";

const TagPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const tag =
    typeof router.query.tag === "string" ? router.query.tag.toLowerCase() : null;

  return (
    <Mainlayout>
      <div className="max-w-2xl space-y-4">
        <Link href="/feed" className="text-sm text-blue-600 hover:underline">
          ← {t("feed.backToFeed")}
        </Link>
        {tag && (
          <>
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">#{tag}</h1>
            <FeedList
              key={tag}
              endpoint={`/post/tag/${tag}`}
              showComposer={false}
              emptyMessage={t("feed.noPostsWithTag", { tag })}
            />
          </>
        )}
      </div>
    </Mainlayout>
  );
};

export default TagPage;