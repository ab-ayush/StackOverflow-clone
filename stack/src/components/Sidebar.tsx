import { cn } from "cn";
import {
  Bell,
  Bookmark,
  Crown,
  Gem,
  Home,
  LifeBuoy,
  MessageSquareIcon,
  Newspaper,
  Shield,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { useAuth } from "@/src/lib/AuthContext";
import { useUnreadCount } from "@/src/lib/useUnreadCount";
import { useLanguage } from "@/src/i18n/LanguageContext";

const linkClass =
  "flex items-center px-2 py-2.5 md:py-2 text-gray-700 hover:bg-gray-100 rounded text-sm";

const Sidebar = ({ isopen, onClose }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && !!user;
  const unread = useUnreadCount(loggedIn);

  return (
    <>
      {/* phones: the dimmed page behind the open drawer; tapping it closes the drawer */}
      {isopen && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "shrink-0 border-r bg-white",
          // phones: a drawer that slides over the page.
          // md and up: a normal column that takes its own width.
          "fixed inset-y-0 left-0 z-[60] w-64 transition-transform duration-200 ease-in-out",
          "md:static md:z-auto md:w-auto md:translate-x-0",
          isopen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* the menu stays in view while the page scrolls, and scrolls inside itself when it is taller than the screen */}
        <aside className="sticky top-0 h-full max-h-screen w-64 overflow-y-auto bg-white md:h-auto md:w-48 lg:w-64">
          <div className="flex justify-end p-2 md:hidden">
            <button
              type="button"
              onClick={onClose}
              aria-label={t("nav.toggleSidebar")}
              className="rounded p-2 text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-2 pt-0 md:pt-2 lg:p-4">
            <ul className="space-y-1">
              <li>
                <Link href="/" className={linkClass}>
                  <Home className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.home")}
                </Link>
              </li>
              <li>
                <Link href="/questions" className={linkClass}>
                  <MessageSquareIcon className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.questions")}
                </Link>
              </li>
              <li>
                <Link href="/feed" className={linkClass}>
                  <Newspaper className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.feed")}
                </Link>
              </li>
              {loggedIn && (
                <li>
                  <Link href="/notifications" className={linkClass}>
                    <Bell className="w-4 h-4 mr-2 lg:mr-3" />
                    {t("sidebar.notifications")}
                    {unread > 0 && (
                      <Badge className="ml-auto text-xs bg-red-500 text-white hover:bg-red-500">
                        {unread > 99 ? "99+" : unread}
                      </Badge>
                    )}
                  </Link>
                </li>
              )}
              {loggedIn && user?.isAdmin && (
                <li>
                  <Link href="/admin/moderation" className={linkClass}>
                    <Shield className="w-4 h-4 mr-2 lg:mr-3" />
                    {t("sidebar.moderation")}
                  </Link>
                </li>
              )}
              <li>
                <Link href="/tags" className={linkClass}>
                  <Tag className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.tags")}
                </Link>
              </li>
              <li>
                <Link href="/users" className={linkClass}>
                  <Users className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.users")}
                </Link>
              </li>
              <li>
                <Link href="/saved" className={linkClass}>
                  <Bookmark className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.saves")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className={linkClass}>
                  <Gem className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.pricing")}
                </Link>
              </li>
              <li>
                <Link href="/lounge" className={linkClass}>
                  <Crown className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.lounge")}
                </Link>
              </li>
              <li>
                <Link href="/support" className={linkClass}>
                  <LifeBuoy className="w-4 h-4 mr-2 lg:mr-3" />
                  {t("sidebar.support")}
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;