import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import axiosInstance from "@/src/lib/axiosinstance";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";

interface TagCount {
  tag: string;
  count: number;
}

const TagsPage = () => {
  const { t } = useLanguage();
  const { number, plural } = useFormatters();
  const [tags, setTags] = useState<TagCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get("/question/getallquestion");
        const counts = new Map<string, number>();
        (res.data.data as any[]).forEach((question) => {
          // a tag counts once per question, whatever its capital letters
          const unique = new Set<string>(
            (question.questiontags || [])
              .map((tag: string) => tag.trim().toLowerCase())
              .filter(Boolean)
          );
          unique.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
        });
        setTags(
          Array.from(counts.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
        );
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? tags.filter((item) => item.tag.includes(needle)) : tags;
  }, [tags, query]);

  return (
    <Mainlayout>
      <div className="max-w-6xl">
        <h1 className="text-xl lg:text-2xl font-semibold mb-2">
          {t("tags.heading")}
        </h1>
        <p className="text-sm text-gray-600 max-w-2xl mb-6">
          {t("tags.description")}
        </p>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("tags.filterPlaceholder")}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-gray-500">{t("tags.noTags")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map(({ tag, count }) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {tag}
                </Badge>
                <p className="text-xs text-gray-600 mt-3">
                  {t(
                    plural(count) === "one"
                      ? "home.questionCount.one"
                      : "home.questionCount.other",
                    { count: number(count) }
                  )}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default TagsPage;