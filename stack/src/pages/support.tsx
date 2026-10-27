import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, LifeBuoy, Send } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { useSubscription } from "@/src/lib/useSubscription";
import { useMyTickets } from "@/src/lib/useSupport";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import PremiumButton from "@/src/components/PremiumButton";
import PriorityChip from "@/src/components/PriorityChip";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { formatWithElements } from "@/src/i18n/format";

export default function SupportPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { relativeTime } = useFormatters();
  const { plans, mine } = useSubscription();
  const [mounted, setMounted] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && !!user;
  const { tickets, loading, sending, create } = useMyTickets(loggedIn);

  const support = plans.find((plan) => plan.id === (mine?.plan ?? "free"))?.support ?? "standard";
  const level = support === "priorityCustomer" ? 2 : support === "priority" ? 1 : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const ok = await create(subject.trim(), message.trim());
    if (ok) {
      setSubject("");
      setMessage("");
    }
  };

  return (
    <Mainlayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-gray-900 lg:text-2xl">
            <LifeBuoy className="h-6 w-6 text-blue-600" />
            {t("support.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{t("support.subtitle")}</p>
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
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-700">{t("support.level")}</span>
              <PriorityChip priority={level} />
              {level === 0 && (
                <span className="text-gray-500">{t("support.upgradeHint")}</span>
              )}
              {level === 0 && (
                <PremiumButton href="/pricing" variant="gold" size="sm">
                  {t("search.seePlans")}
                </PremiumButton>
              )}
              {user.isAdmin && (
                <span className="ml-auto">
                  <PremiumButton
                    href="/admin/support"
                    variant="soft"
                    size="sm"
                    icon={<Inbox className="h-3.5 w-3.5" />}
                  >
                    {t("support.openInbox")}
                  </PremiumButton>
                </span>
              )}
            </div>

            <Card>
              <CardContent className="p-6">
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <Label htmlFor="ticket-subject">{t("support.subject")}</Label>
                    <Input
                      id="ticket-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("support.subjectPlaceholder")}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ticket-message">{t("support.message")}</Label>
                    <Textarea
                      id="ticket-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("support.messagePlaceholder")}
                      maxLength={2000}
                      className="min-h-32"
                    />
                  </div>
                  <PremiumButton
                    type="submit"
                    icon={<Send className="h-4 w-4" />}
                    loading={sending}
                    disabled={!subject.trim() || !message.trim()}
                  >
                    {sending ? t("support.sending") : t("support.send")}
                  </PremiumButton>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("support.myTickets")}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-gray-500">{t("support.noTickets")}</p>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket._id} className="rounded-xl border p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-gray-500">{ticket.number}</span>
                          <PriorityChip priority={ticket.priority} />
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              ticket.status === "open"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {t(
                              ticket.status === "open"
                                ? "support.status.open"
                                : "support.status.closed"
                            )}
                          </span>
                          <span className="ml-auto text-xs text-gray-400">
                            {relativeTime(ticket.createdAt)}
                          </span>
                        </div>
                        <h3 className="mt-2 font-medium text-gray-900">{ticket.subject}</h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                          {ticket.message}
                        </p>
                        {ticket.adminReply && (
                          <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                            <p className="text-xs font-semibold text-green-800">
                              {t("support.reply")}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                              {ticket.adminReply}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Mainlayout>
  );
}