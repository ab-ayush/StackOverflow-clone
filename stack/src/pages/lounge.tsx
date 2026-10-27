import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Crown, Lock, Send, Trash2, Users } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { useSubscription } from "@/src/lib/useSubscription";
import { useLounge } from "@/src/lib/useLounge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Textarea } from "@/src/components/ui/textarea";
import PremiumButton from "@/src/components/PremiumButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { formatWithElements } from "@/src/i18n/format";

export default function LoungePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { relativeTime, number, plural } = useFormatters();
  const { plans, mine } = useSubscription();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && !!user;
  const allowed = !!mine && !!plans.find((plan) => plan.id === mine.plan)?.exclusive;
  const lounge = useLounge(loggedIn && allowed);
  const isLocked = loggedIn && !!mine && (!allowed || lounge.locked);

  // stay at the newest message, unless the member scrolled up to read older ones
  useEffect(() => {
    const node = listRef.current;
    if (node && stickToBottom.current) node.scrollTop = node.scrollHeight;
  }, [lounge.messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    stickToBottom.current = true;
    const ok = await lounge.post(content);
    if (ok) setDraft("");
  };

  const handleScroll = () => {
    const node = listRef.current;
    if (!node) return;
    stickToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
  };

  return (
    <Mainlayout>
      <div className="max-w-5xl space-y-5">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-6 py-5 text-white shadow-md">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Crown className="h-7 w-7" />
            {t("lounge.title")}
          </h1>
          <p className="mt-1 text-sm text-white/90">{t("lounge.subtitle")}</p>
        </div>

        {!mounted ? null : !user ? (
          <p className="text-sm text-gray-600">
            {formatWithElements(t("support.loginRequired"), {
              login: (
                <Link href="/auth" className="text-blue-600 hover:underline">
                  {t("nav.login")}
                </Link>
              ),
            })}
          </p>
        ) : isLocked ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <div className="rounded-full bg-yellow-100 p-4">
                <Lock className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{t("lounge.lockedTitle")}</h2>
              <p className="max-w-md text-sm text-gray-600">{t("lounge.lockedText")}</p>
              <PremiumButton
                href="/pricing"
                variant="gold"
                icon={<Crown className="h-4 w-4" />}
              >
                {t("lounge.upgrade")}
              </PremiumButton>
            </CardContent>
          </Card>
        ) : !mine || lounge.loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <Card>
              <CardContent className="flex flex-col gap-3 p-4">
                <div
                  ref={listRef}
                  onScroll={handleScroll}
                  className="max-h-[55vh] min-h-[280px] space-y-3 overflow-y-auto pr-1"
                >
                  {lounge.hasMore && (
                    <div className="text-center">
                      <PremiumButton
                        size="sm"
                        variant="outline"
                        loading={lounge.loadingOlder}
                        onClick={() => {
                          stickToBottom.current = false;
                          lounge.loadOlder();
                        }}
                      >
                        {t("lounge.loadOlder")}
                      </PremiumButton>
                    </div>
                  )}

                  {lounge.messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-gray-500">{t("lounge.empty")}</p>
                  ) : (
                    lounge.messages.map((message) => {
                      const mineMessage = message.author?._id === user._id;
                      const canDelete = mineMessage || !!user.isAdmin;
                      const name = message.author?.name || "?";
                      return (
                        <div
                          key={message._id}
                          className={`flex gap-2 ${mineMessage ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="mt-1 h-8 w-8 ring-2 ring-yellow-300">
                            <AvatarFallback className="text-xs">{name[0]}</AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                              mineMessage ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <div className="flex items-baseline gap-2 text-xs">
                              {message.author ? (
                                <Link
                                  href={`/users/${message.author._id}`}
                                  className={`font-semibold ${
                                    mineMessage ? "text-white" : "text-blue-600"
                                  }`}
                                >
                                  {name}
                                </Link>
                              ) : (
                                <span className="font-semibold">{name}</span>
                              )}
                              <span className={mineMessage ? "text-blue-100" : "text-gray-400"}>
                                {relativeTime(message.createdAt)}
                              </span>
                              {canDelete && (
                                <button
                                  type="button"
                                  aria-label={t("common.delete")}
                                  onClick={() => {
                                    if (window.confirm(t("lounge.confirmDelete"))) {
                                      lounge.remove(message._id);
                                    }
                                  }}
                                  className={mineMessage ? "text-blue-100 hover:text-white" : "text-gray-400 hover:text-red-600"}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={send} className="space-y-2 border-t pt-3">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t("lounge.placeholder")}
                    maxLength={1000}
                    className="min-h-20 resize-none"
                  />
                  <PremiumButton
                    type="submit"
                    size="sm"
                    icon={<Send className="h-3.5 w-3.5" />}
                    loading={lounge.posting}
                    disabled={!draft.trim()}
                  >
                    {lounge.posting ? t("lounge.posting") : t("lounge.post")}
                  </PremiumButton>
                </form>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-yellow-600" />
                  {t("lounge.members")}
                </CardTitle>
                <p className="text-xs text-gray-500">
                  {t(
                    plural(lounge.members.length) === "one"
                      ? "lounge.memberCount.one"
                      : "lounge.memberCount.other",
                    { count: number(lounge.members.length) }
                  )}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {lounge.members.map((member) => (
                  <Link
                    key={member._id}
                    href={`/users/${member._id}`}
                    className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-yellow-50"
                  >
                    <Avatar className="h-7 w-7 ring-2 ring-yellow-300">
                      <AvatarFallback className="text-xs">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{member.name}</p>
                      {member.username && (
                        <p className="truncate text-xs text-gray-500">@{member.username}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Mainlayout>
  );
}