import { useAuth } from "@/src/lib/AuthContext";
import { useUnreadCount } from "@/src/lib/useUnreadCount";
import { useLanguage } from "@/src/i18n/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { Bell, Menu, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Navbar = ({ handleslidein }: any) => {
  const { user, Logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [searchText, setSearchText] = useState("");
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const unread = useUnreadCount(hasMounted && !!user);
  const handlelogout = () => {
    Logout();
  };
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) return;
    router.push({ pathname: "/search", query: { q } });
  };
  return (
    <div className=" top-0 z-50 w-full min-h-[53px] bg-white border-t-[3px] border-[#ef8236] shadow-[0_1px_5px_#00000033] flex items-center justify-center">
      <div className="w-full max-w-[1440px] px-2 sm:w-[90%] sm:px-0 flex items-center justify-between mx-auto py-1">
        <button
          aria-label={t("nav.toggleSidebar")}
          className="sm:block md:hidden p-2 rounded hover:bg-gray-100 transition"
          onClick={handleslidein}
        >
          <Menu className="w-5 h-5 text-gray-800" />
        </button>
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <Link href="/" className="px-1 sm:px-3 py-1 shrink-0">
            <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
          </Link>

          <div className="hidden sm:flex gap-1">
            {(["nav.about", "nav.products", "nav.forTeams"] as const).map((key) => (
              <Link
                key={key}
                href="/"
                className="text-sm text-[#454545] font-medium px-4 py-2 rounded hover:bg-gray-200 transition"
              >
                {t(key)}
              </Link>
            ))}
          </div>
          <form
            onSubmit={submitSearch}
            className="hidden lg:block flex-grow relative px-3"
          >
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="w-full max-w-[600px] pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-gray-600" />
          </form>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/search"
            aria-label={t("search.title")}
            className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </Link>
          <LanguageSwitcher />
          {!hasMounted ? null : !user ? (
            <Link
              href="/auth"
              className="text-xs sm:text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-3 sm:px-4 py-1.5 rounded transition"
            >
              {t("nav.login")}
            </Link>
          ) : (
            <>
              <Link
                href="/notifications"
                aria-label={
                  unread > 0
                    ? t("nav.notificationsUnread", { count: unread })
                    : t("nav.notifications")
                }
                className="relative p-2 rounded-full hover:bg-gray-100 transition"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>

              <Link
                href={`/users/${user._id}`}
                className="flex shrink-0 items-center justify-center bg-orange-600 text-white text-sm font-semibold w-8 h-8 sm:w-9 sm:h-9 rounded-full"
              >
                {user.name?.charAt(0).toUpperCase()}
              </Link>

              <button
                onClick={handlelogout}
                className="text-xs sm:text-sm font-medium text-[#454545] bg-[#e7f8fe] hover:bg-[#d3e4eb] border border-blue-500 px-2 sm:px-4 py-1.5 rounded transition"
              >
                {t("nav.logout")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;