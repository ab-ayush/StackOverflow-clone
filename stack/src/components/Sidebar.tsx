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
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { useAuth } from "@/src/lib/AuthContext";
import { useUnreadCount } from "@/src/lib/useUnreadCount";
import { useLanguage } from "@/src/i18n/LanguageContext";

const linkClass =
  "flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm";

const Sidebar = ({ isopen }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && !!user;
  const unread = useUnreadCount(loggedIn);

  return (
    // the wrapper is as tall as the page, so the background and the right border always run full height
    <div className="shrink-0 border-r bg-white">
      {/* the menu itself stays in view while the page scrolls */}
      <aside
        className={cn(
          "sticky top-0 max-h-screen overflow-y-auto w-48 lg:w-64 bg-white shadow-sm transition-transform duration-200 ease-in-out md:translate-x-0",
          isopen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-2 lg:p-4">
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
  );
};

export default Sidebar;