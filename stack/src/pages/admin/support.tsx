import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Send } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { useSupportInbox } from "@/src/lib/useSupport";
import { Card, CardContent } from "@/src/components/ui/card";
import { Textarea } from "@/src/components/ui/textarea";
import PremiumButton from "@/src/components/PremiumButton";
import PriorityChip from "@/src/components/PriorityChip";
import PlanBadge from "@/src/components/PlanBadge";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";

type Tab = "open" | "closed";

export default function SupportInboxPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { relativeTime, number } = useFormatters();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("open");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && !!user?.isAdmin;
  const { tickets, loading, busyId, reply } = useSupportInbox(isAdmin, tab);

  const tabClass = (name: Tab) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
      tab === name ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <Mainlayout>
      <div className="max-w-3xl space-y-4">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 lg:text-2xl">
          <Inbox className="h-6 w-6 text-blue-600" />
          {t("supportAdmin.title")}
        </h1>

        {!mounted ? null : !isAdmin ? (
          <p className="text-sm text-gray-600">{t("supportAdmin.adminOnly")}</p>
        ) : (
          <>
            <div className="flex gap-2">
              <button className={tabClass("open")} onClick={() => setTab("open")}>
                {t("supportAdmin.tab.open")}
              </button>
              <button className={tabClass("closed")} onClick={() => setTab("closed")}>
                {t("supportAdmin.tab.closed")}
              </button>
            </div>

            {loading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
            ) : tickets.length === 0 ? (
              <p className="text-sm text-gray-500">{t("supportAdmin.empty")}</p>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => {
                  const draft = drafts[ticket._id] || "";
                  return (
                    <Card key={ticket._id}>
                      <CardContent className="space-y-3 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">{ticket.number}</span>
                          <PriorityChip priority={ticket.priority} />
                          <PlanBadge plan={ticket.plan} />
                          <span className="ml-auto text-xs text-gray-400">
                            {relativeTime(ticket.createdAt)}
                          </span>
                        </div>

                        {ticket.user && (
                          <p className="text-sm text-gray-600">
                            {t("supportAdmin.from", { name: ticket.user.name })}{" "}
                            <Link
                              href={`/users/${ticket.user._id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {ticket.user.email}
                            </Link>
                          </p>
                        )}

                        <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                        <p className="whitespace-pre-wrap rounded-md border bg-gray-50 p-3 text-sm text-gray-800">
                          {ticket.message}
                        </p>

                        {tab === "open" ? (
                          <div className="space-y-2">
                            <Textarea
                              value={draft}
                              onChange={(e) =>
                                setDrafts((prev) => ({ ...prev, [ticket._id]: e.target.value }))
                              }
                              placeholder={t("supportAdmin.replyPlaceholder")}
                              maxLength={2000}
                              className="min-h-24"
                            />
                            <PremiumButton
                              size="sm"
                              icon={<Send className="h-3.5 w-3.5" />}
                              loading={busyId === ticket._id}
                              disabled={!draft.trim()}
                              onClick={() => reply(ticket._id, draft.trim())}
                            >
                              {t("supportAdmin.sendReply")}
                            </PremiumButton>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-xs font-semibold text-green-800">
                              {t("support.reply")}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                              {ticket.adminReply}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Mainlayout>
  );
}