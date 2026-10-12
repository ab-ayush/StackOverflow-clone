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
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { useAuth } from "@/src/lib/AuthContext";
import { useUnreadCount } from "@/src/lib/useUnreadCount";

const Sidebar = ({ isopen }: any) => {
  const { user } = useAuth();
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
              <Link
                href="/"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Home className="w-4 h-4 mr-2 lg:mr-3" />
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/questions"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <MessageSquareIcon className="w-4 h-4 mr-2 lg:mr-3" />
                Questions
              </Link>
            </li>
            <li>
              <Link
                href="/feed"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Newspaper className="w-4 h-4 mr-2 lg:mr-3" />
                Feed
              </Link>
            </li>
            {loggedIn && (
              <li>
                <Link
                  href="/notifications"
                  className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                >
                  <Bell className="w-4 h-4 mr-2 lg:mr-3" />
                  Notifications
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
                <Link
                  href="/admin/moderation"
                  className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
                >
                  <Shield className="w-4 h-4 mr-2 lg:mr-3" />
                  Moderation
                </Link>
              </li>
            )}
            <li>
              <Link
                href="#"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Bot className="w-4 h-4 mr-2 lg:mr-3" />
                AI Assist
                <Badge variant="secondary" className="ml-auto text-xs">
                  Labs
                </Badge>
              </Link>
            </li>
            <li>
              <Link
                href="/tags"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Tag className="w-4 h-4 mr-2 lg:mr-3" />
                Tags
              </Link>
            </li>
            <li>
              <Link
                href="/users"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Users className="w-4 h-4 mr-2 lg:mr-3" />
                Users
              </Link>
            </li>
            <li>
              <Link
                href="/saved"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Bookmark className="w-4 h-4 mr-2 lg:mr-3" />
                Saves
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Trophy className="w-4 h-4 mr-2 lg:mr-3" />
                Challenges
                <Badge
                  variant="secondary"
                  className="ml-auto text-xs bg-orange-100 text-orange-800"
                >
                  NEW
                </Badge>
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-2 lg:mr-3" />
                Chat
              </Link>
            </li>
            <li>
              <Link
                href="#"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <FileText className="w-4 h-4 mr-2 lg:mr-3" />
                Articles
              </Link>
            </li>

            <li>
              <Link
                href="#"
                className="flex items-center px-2 py-2 text-gray-700 hover:bg-gray-100 rounded text-sm"
              >
                <Building className="w-4 h-4 mr-2 lg:mr-3" />
                Companies
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
