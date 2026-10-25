import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  Bell,
  CheckCheck,
  ChevronDown,
  CornerDownRight,
  Heart,
  Loader2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { NotificationItem, useNotifications } from "@/src/lib/useNotifications";
import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { formatWithElements } from "@/src/i18n/format";
import type { TranslationKey } from "@/src/i18n/translate";

const messageKeyFor = (n: NotificationItem): TranslationKey => {
  switch (n.type) {
    case "like":
      return "notifications.like";
    case "comment":
      return "notifications.comment";
    case "reply":
      return "notifications.reply";
    case "mention":
      return n.onComment ? "notifications.mentionComment" : "notifications.mentionPost";
    case "follow":
      return "notifications.follow";
  }
};

const iconFor = (type: NotificationItem["type"]) => {
  const cls = "w-5 h-5";
  switch (type) {
    case "like":
      return <Heart className={`${cls} text-red-500`} />;
    case "comment":
      return <MessageCircle className={`${cls} text-blue-500`} />;
    case "reply":
      return <CornerDownRight className={`${cls} text-blue-500`} />;
    case "mention":
      return <AtSign className={`${cls} text-purple-500`} />;
    case "follow":
      return <UserPlus className={`${cls} text-green-600`} />;
  }
};

const targetFor = (n: NotificationItem) =>
  n.type !== "follow" && n.postId ? `/feed/${n.postId}` : `/users/${n.actor._id}`;

const NotificationsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { relativeTime } = useFormatters();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && !!user;
  const { items, loading, loadingMore, hasMore, loadMore, markRead, markAllRead } =
    useNotifications(loggedIn);
  const hasUnread = items.some((n) => !n.read);

  return (
    <Mainlayout>
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">
            {t("notifications.heading")}
          </h1>
          {hasUnread && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-blue-600">
              <CheckCheck className="w-4 h-4 mr-1" />
              {t("notifications.markAll")}
            </Button>
          )}
        </div>

        {mounted && !user ? (
          <p className="text-sm text-gray-600">
            {formatWithElements(t("notifications.loginToView"), {
              login: (
                <Link href="/auth" className="text-blue-600 hover:underline">
                  {t("nav.login")}
                </Link>
              ),
            })}
          </p>
        ) : loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto" />
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{t("notifications.empty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <Link
                key={n._id}
                href={targetFor(n)}
                onClick={() => markRead(n._id)}
                className={`flex gap-3 p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                  n.read ? "bg-white" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="mt-0.5">{iconFor(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    {formatWithElements(t(messageKeyFor(n)), {
                      name: <span className="font-medium">{n.actor.name}</span>,
                    })}
                  </p>
                  {n.preview && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">“{n.preview}”</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{relativeTime(n.createdAt)}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />}
              </Link>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-2 pb-6">
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  {t("notifications.loadMore")}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default NotificationsPage;