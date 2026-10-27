import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Lock, Search as SearchIcon, SlidersHorizontal, Star, X } from "lucide-react";
import { toast } from "react-toastify";
import Mainlayout from "@/src/layout/Mainlayout";
import axiosInstance from "@/src/lib/axiosinstance";
import { useSubscription } from "@/src/lib/useSubscription";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import PlanBadge from "@/src/components/PlanBadge";
import PremiumButton from "@/src/components/PremiumButton";
import type { PlanId } from "@/src/lib/plans";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { apiErrorMessage } from "@/src/i18n/runtime";

interface SearchResult {
  _id: string;
  questiontitle: string;
  excerpt: string;
  questiontags: string[];
  votes: number;
  noofanswer: number;
  hasAccepted: boolean;
  userposted: string;
  userid: string;
  askedon: string;
  authorPlan: PlanId;
  boosted: boolean;
}

interface Filters {
  q: string;
  tag: string;
  author: string;
  answered: string;
  minVotes: string;
  from: string;
  to: string;
  sort: string;
}

const EMPTY: Filters = {
  q: "",
  tag: "",
  author: "",
  answered: "",
  minVotes: "",
  from: "",
  to: "",
  sort: "relevance",
};
const KEYS = Object.keys(EMPTY) as (keyof Filters)[];
const ADVANCED_KEYS: (keyof Filters)[] = [
  "tag",
  "author",
  "answered",
  "minVotes",
  "from",
  "to",
  "sort",
];

const isSet = (key: keyof Filters, value: string) =>
  value !== "" && !(key === "sort" && value === "relevance");

const fromQuery = (query: Record<string, string | string[] | undefined>): Filters => {
  const out = { ...EMPTY };
  KEYS.forEach((key) => {
    const value = query[key];
    if (typeof value === "string") out[key] = value;
  });
  return out;
};

const selectClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function SearchPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { date, number, plural } = useFormatters();
  const { plans, mine } = useSubscription();

  const [form, setForm] = useState<Filters>(EMPTY);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const page = Math.max(1, parseInt(String(router.query.page || "1"), 10) || 1);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const advancedAllowed = useMemo(() => {
    if (!mine) return false;
    return !!plans.find((plan) => plan.id === mine.plan)?.advancedSearch;
  }, [plans, mine]);

  // the URL is the source of truth: every search changes it, and it can be shared or bookmarked
  useEffect(() => {
    if (!router.isReady) return;
    const active = fromQuery(router.query);
    setForm(active);
    if (ADVANCED_KEYS.some((key) => isSet(key, active[key]))) setShowFilters(true);

    const params: Record<string, string> = {};
    KEYS.forEach((key) => {
      if (isSet(key, active[key])) params[key] = active[key];
    });
    if (!Object.keys(params).length) {
      setResults([]);
      setTotal(0);
      setHasSearched(false);
      return;
    }
    params.page = String(page);

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/question/search", { params });
        if (cancelled) return;
        setResults(res.data.data);
        setTotal(res.data.total);
        setPageSize(res.data.pageSize || 10);
        setHasSearched(true);
      } catch (error: any) {
        if (cancelled) return;
        console.log(error);
        toast.error(apiErrorMessage(error, "search.failed"));
        setResults([]);
        setTotal(0);
        setHasSearched(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.asPath]);

  const buildQuery = (values: Filters, nextPage = 1) => {
    const query: Record<string, string> = {};
    KEYS.forEach((key) => {
      if (!advancedAllowed && ADVANCED_KEYS.includes(key)) return;
      const value = values[key].trim();
      if (isSet(key, value)) query[key] = value;
    });
    if (nextPage > 1) query.page = String(nextPage);
    return query;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push({ pathname: "/search", query: buildQuery(form) });
  };

  const goToPage = (nextPage: number) => {
    router.push({ pathname: "/search", query: buildQuery(fromQuery(router.query), nextPage) });
  };

  const clearFilters = () => {
    router.push({ pathname: "/search", query: form.q.trim() ? { q: form.q.trim() } : {} });
  };

  const set = (key: keyof Filters, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Mainlayout>
      <div className="max-w-4xl space-y-5">
        <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">{t("search.title")}</h1>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={form.q}
                onChange={(e) => set("q", e.target.value)}
                placeholder={t("search.inputPlaceholder")}
                className="pl-10"
                maxLength={100}
              />
            </div>
            <PremiumButton type="submit" icon={<SearchIcon className="h-4 w-4" />}>
              {t("search.button")}
            </PremiumButton>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("search.filters")}
              {!advancedAllowed && <Lock className="h-3.5 w-3.5 text-gray-400" />}
            </button>

            {showFilters && (
              <div className="mt-3 space-y-4 rounded-xl border bg-gray-50 p-4">
                {!advancedAllowed && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t("search.filtersLocked")}
                    </span>
                    <PremiumButton href="/pricing" variant="gold" size="sm">
                      {t("search.seePlans")}
                    </PremiumButton>
                  </div>
                )}

                <fieldset
                  disabled={!advancedAllowed}
                  className={`grid gap-4 sm:grid-cols-2 ${!advancedAllowed ? "opacity-50" : ""}`}
                >
                  <div>
                    <Label htmlFor="f-tag">{t("search.filter.tag")}</Label>
                    <Input
                      id="f-tag"
                      value={form.tag}
                      onChange={(e) => set("tag", e.target.value)}
                      maxLength={40}
                    />
                  </div>
                  <div>
                    <Label htmlFor="f-author">{t("search.filter.author")}</Label>
                    <Input
                      id="f-author"
                      value={form.author}
                      onChange={(e) => set("author", e.target.value)}
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <Label htmlFor="f-answered">{t("search.filter.answered")}</Label>
                    <select
                      id="f-answered"
                      value={form.answered}
                      onChange={(e) => set("answered", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">{t("search.answered.any")}</option>
                      <option value="yes">{t("search.answered.yes")}</option>
                      <option value="no">{t("search.answered.no")}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="f-votes">{t("search.filter.minVotes")}</Label>
                    <Input
                      id="f-votes"
                      type="number"
                      min={0}
                      value={form.minVotes}
                      onChange={(e) => set("minVotes", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="f-from">{t("search.filter.from")}</Label>
                    <Input
                      id="f-from"
                      type="date"
                      value={form.from}
                      onChange={(e) => set("from", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="f-to">{t("search.filter.to")}</Label>
                    <Input
                      id="f-to"
                      type="date"
                      value={form.to}
                      onChange={(e) => set("to", e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="f-sort">{t("search.filter.sort")}</Label>
                    <select
                      id="f-sort"
                      value={form.sort}
                      onChange={(e) => set("sort", e.target.value)}
                      className={selectClass}
                    >
                      <option value="relevance">{t("search.sort.relevance")}</option>
                      <option value="newest">{t("search.sort.newest")}</option>
                      <option value="votes">{t("search.sort.votes")}</option>
                      <option value="answers">{t("search.sort.answers")}</option>
                    </select>
                  </div>
                </fieldset>

                {advancedAllowed && ADVANCED_KEYS.some((key) => isSet(key, form[key])) && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                    {t("search.clear")}
                  </button>
                )}
              </div>
            )}
          </div>
        </form>

        {loading ? (
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        ) : !hasSearched ? (
          <p className="text-sm text-gray-500">{t("search.prompt")}</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-gray-500">{t("search.noResults")}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {t(plural(total) === "one" ? "search.resultCount.one" : "search.resultCount.other", {
                count: number(total),
              })}
            </p>

            {results.map((result) => (
              <div
                key={result._id}
                className={`flex gap-4 rounded-xl border p-4 ${
                  result.boosted ? "border-yellow-300 bg-yellow-50/50" : "bg-white"
                }`}
              >
                <div className="w-16 shrink-0 space-y-2 text-center text-xs text-gray-600">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{number(result.votes)}</div>
                    {t(plural(result.votes) === "one" ? "home.votes.one" : "home.votes.other")}
                  </div>
                  <div
                    className={
                      result.noofanswer > 0
                        ? `rounded px-1 py-1 ${
                            result.hasAccepted
                              ? "bg-green-600 text-white"
                              : "bg-green-100 text-green-700"
                          }`
                        : ""
                    }
                  >
                    <div className="text-sm font-semibold">{number(result.noofanswer)}</div>
                    {t(
                      plural(result.noofanswer) === "one"
                        ? "home.answers.one"
                        : "home.answers.other"
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/questions/${result._id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {result.questiontitle}
                    </Link>
                    {result.boosted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        <Star className="h-3 w-3" />
                        {t("search.topResult")}
                      </span>
                    )}
                    {result.hasAccepted && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {t("search.accepted")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-700">{result.excerpt}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1">
                      {result.questiontags.map((tag) => (
                        <Link key={tag} href={`/tags/${encodeURIComponent(tag.toLowerCase())}`}>
                          <Badge
                            variant="secondary"
                            className="cursor-pointer bg-blue-100 text-xs text-blue-800 hover:bg-blue-200"
                          >
                            {tag}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Link
                        href={`/users/${result.userid}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {result.userposted}
                      </Link>
                      <PlanBadge plan={result.authorPlan} />
                      <span>· {t("home.askedOn", { date: date(result.askedon) })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {pages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <PremiumButton
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  {t("search.prev")}
                </PremiumButton>
                <span className="text-sm text-gray-600">
                  {t("search.pageOf", { page: number(page), pages: number(pages) })}
                </span>
                <PremiumButton
                  variant="outline"
                  size="sm"
                  disabled={page >= pages}
                  onClick={() => goToPage(page + 1)}
                >
                  {t("search.next")}
                </PremiumButton>
              </div>
            )}
          </div>
        )}
      </div>
    </Mainlayout>
  );
}