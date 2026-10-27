import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Crown, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Input } from "@/src/components/ui/input";
import Mainlayout from "@/src/layout/Mainlayout";
import axiosInstance from "@/src/lib/axiosinstance";
import PlanBadge from "@/src/components/PlanBadge";
import { effectivePlan, PlanId, tierOf } from "@/src/lib/plans";
import { useLanguage } from "@/src/i18n/LanguageContext";

const cardStyles: Record<PlanId, string> = {
  free: "border-gray-200",
  bronze: "border-amber-200",
  silver: "border-slate-300 bg-slate-50 shadow-sm",
  gold: "border-yellow-400 bg-gradient-to-br from-yellow-50 to-white shadow-md",
};

const ringStyles: Record<PlanId, string> = {
  free: "",
  bronze: "ring-2 ring-amber-300",
  silver: "ring-2 ring-slate-300",
  gold: "ring-2 ring-yellow-400",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

const index = () => {
  const { t } = useLanguage();
  const [users, setusers] = useState<any[] | null>(null);
  const [loading, setloading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchuser = async () => {
      try {
        const res = await axiosInstance.get("/user/getalluser");
        setusers(res.data.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchuser();
  }, []);

  // every user with the plan they can use right now, best plan first
  const ranked = useMemo(
    () =>
      (users || [])
        .map((user) => ({ ...user, activePlan: effectivePlan(user.plan, user.planExpiresAt) }))
        .sort(
          (a, b) =>
            tierOf(b.activePlan) - tierOf(a.activePlan) || a.name.localeCompare(b.name)
        ),
    [users]
  );

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? ranked.filter(
        (user) =>
          user.name.toLowerCase().includes(needle) ||
          (user.username || "").toLowerCase().includes(needle)
      )
    : ranked;
  const featured = ranked.filter((user) => user.activePlan === "gold").slice(0, 8);

  if (loading) {
    return (
      <Mainlayout>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </Mainlayout>
    );
  }
  if (!users || users.length === 0) {
    return (
      <Mainlayout>
        <div className="text-center text-gray-500 mt-4">{t("users.noUsers")}</div>
      </Mainlayout>
    );
  }

  return (
    <Mainlayout>
      <div className="max-w-6xl space-y-6">
        <h1 className="text-xl lg:text-2xl font-semibold">{t("users.heading")}</h1>

        {featured.length > 0 && !needle && (
          <section className="rounded-2xl bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Crown className="h-4 w-4" />
              {t("users.featured")}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {featured.map((user) => (
                <Link
                  key={user._id}
                  href={`/users/${user._id}`}
                  className="flex min-w-[180px] items-center gap-3 rounded-xl border border-yellow-300 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Avatar className={`h-10 w-10 ${ringStyles.gold}`}>
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                    {user.username && (
                      <p className="truncate text-xs text-gray-500">@{user.username}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("users.filterPlaceholder")}
            className="pl-10"
          />
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-gray-500">{t("users.noMatches")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((user) => (
              <Link key={user._id} href={`/users/${user._id}`}>
                <div
                  className={`relative cursor-pointer rounded-lg border p-4 transition hover:shadow-md ${cardStyles[user.activePlan as PlanId]}`}
                >
                  {user.activePlan === "gold" && (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase text-yellow-950">
                      <Crown className="h-3 w-3" />
                      {t("users.featuredTag")}
                    </span>
                  )}
                  <div className="flex items-center mb-3">
                    <Avatar className={`w-12 h-12 mr-3 ${ringStyles[user.activePlan as PlanId]}`}>
                      <AvatarFallback className="text-lg">{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-blue-600 hover:text-blue-800 truncate">
                        {user.name}
                      </h3>
                      {user.username && (
                        <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>
                        {t("users.joined", {
                          year: String(new Date(user.joinDate).getFullYear()),
                        })}
                      </span>
                    </div>
                    <PlanBadge plan={user.activePlan} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default index;