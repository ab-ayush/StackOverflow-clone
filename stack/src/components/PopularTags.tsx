import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Hash } from "lucide-react";
import axiosInstance from "@/src/lib/axiosinstance";

interface PopularTag {
  tag: string;
  count: number;
}

export default function PopularTags() {
  const router = useRouter();
  const [tags, setTags] = useState<PopularTag[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axiosInstance.get("/post/tags/popular");
        setTags(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };
    load();
  }, []);

  const goToTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = query.trim().replace(/^#/, "").toLowerCase();
    if (/^[a-z][a-z0-9_]{0,29}$/.test(tag)) {
      router.push(`/feed/tag/${tag}`);
      setQuery("");
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={goToTag}>
        <div className="relative">
          <Hash className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a hashtag"
            className="w-full border rounded-full pl-9 pr-3 py-1.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </form>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t.tag}
              href={`/feed/tag/${t.tag}`}
              className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              #{t.tag} <span className="text-blue-400">{t.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}