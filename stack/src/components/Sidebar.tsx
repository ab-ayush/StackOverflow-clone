import { cn } from "cn";
import {
  Bell,
  Bookmark,
  Bot,
  Building,
  FileText,
  Home,
  MessageSquare,
  MessageSquareIcon,
  Newspaper,
  Shield,
  Tag,
  Trophy,
  Users,
  Gem,
  Crown,
  LifeBuoy,
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
    <div>
      <aside
        className={cn(
          " top-[53px]  w-48 lg:w-64 min-h-screen bg-white shadow-sm border-r transition-transform duration-200 ease-in-out md:translate-x-0",
          isopen ? "translate-x-0" : "-translate-x-full",
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
              <Link href="#" className={linkClass}>
                <Bot className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.aiAssist")}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {t("sidebar.labs")}
                </Badge>
              </Link>
            </li>
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
            <li>
              <Link href="#" className={linkClass}>
                <Trophy className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.challenges")}
                <Badge
                  variant="secondary"
                  className="ml-auto text-xs bg-orange-100 text-orange-800"
                >
                  {t("sidebar.new")}
                </Badge>
              </Link>
            </li>
            <li>
              <Link href="#" className={linkClass}>
                <MessageSquare className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.chat")}
              </Link>
            </li>
            <li>
              <Link href="#" className={linkClass}>
                <FileText className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.articles")}
              </Link>
            </li>
            <li>
              <Link href="#" className={linkClass}>
                <Building className="w-4 h-4 mr-2 lg:mr-3" />
                {t("sidebar.companies")}
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
