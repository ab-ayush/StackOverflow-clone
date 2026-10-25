import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Check, ExternalLink, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { ReportGroup, useModeration } from "@/src/lib/useModeration";
import { reasonLabelKey } from "@/src/lib/reportReasons";
import { Card, CardContent } from "@/src/components/ui/card";
import ModerationButton from "@/src/components/ModerationButton";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";

const REPEAT_OFFENDER_THRESHOLD = 2;

type Tab = "reports" | "suspended";

const ModerationPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { number, plural, relativeTime } = useFormatters();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("reports");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && !!user?.isAdmin;
  const { reports, suspended, loading, busyKey, dismiss, removePost, suspend, unsuspend } =
    useModeration(isAdmin);

  const reasonText = (reason: string) => {
    const key = reasonLabelKey(reason);
    return key ? t(key) : reason;
  };

  const removedText = (count: number) =>
    t(
      plural(count) === "one"
        ? "moderation.removedCount.one"
        : "moderation.removedCount.other",
      { count: number(count) }
    );

  const handleRemove = (r: ReportGroup) => {
    const reason = window.prompt(
      t("moderation.promptRemove"),
      t("moderation.defaultRemoveReason")
    );
    if (reason === null) return;
    removePost(r.postId, reason);
  };

  const handleSuspend = (r: ReportGroup) => {
    if (!r.author) return;
    const reason = window.prompt(
      t("moderation.promptSuspend", { name: r.author.name }),
      t("moderation.defaultSuspendReason")
    );
    if (reason === null) return;
    suspend(r.author._id, reason);
  };

  const tabClass = (name: Tab) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
      tab === name
        ? "bg-blue-600 text-white shadow-sm"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  const countBadge = (count: number, name: Tab) =>
    count > 0 && (
      <span
        className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
          tab === name ? "bg-white/25 text-white" : "bg-red-100 text-red-700"
        }`}
      >
        {number(count)}
      </span>
    );

  return (
    <Mainlayout>
      <div className="max-w-3xl space-y-4">
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          {t("moderation.heading")}
        </h1>

        {!mounted ? null : !isAdmin ? (
          <p className="text-sm text-gray-600">{t("moderation.adminOnly")}</p>
        ) : (
          <>
            <div className="flex gap-2">
              <button className={tabClass("reports")} onClick={() => setTab("reports")}>
                {t("moderation.tab.reports")}
                {countBadge(reports.length, "reports")}
              </button>
              <button className={tabClass("suspended")} onClick={() => setTab("suspended")}>
                {t("moderation.tab.suspended")}
                {countBadge(suspended.length, "suspended")}
              </button>
            </div>

            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto" />
            ) : tab === "reports" ? (
              reports.length === 0 ? (
                <p className="text-sm text-gray-500">{t("moderation.noReports")}</p>
              ) : (
                <div className="space-y-4">
                  {reports.map((r) => {
                    const repeat =
                      (r.author?.removedPostCount ?? 0) >= REPEAT_OFFENDER_THRESHOLD;
                    return (
                      <Card key={r.postId}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                              {t(
                                plural(r.reportCount) === "one"
                                  ? "moderation.reportCount.one"
                                  : "moderation.reportCount.other",
                                { count: number(r.reportCount) }
                              )}
                            </span>
                            {Object.entries(r.reasonCounts).map(([reason, count]) => (
                              <span
                                key={reason}
                                className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs"
                              >
                                {reasonText(reason)} × {number(count)}
                              </span>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            {r.author ? (
                              <>
                                <Link
                                  href={`/users/${r.author._id}`}
                                  className="font-medium text-blue-600 hover:underline"
                                >
                                  {r.author.name}
                                </Link>
                                {r.author.username && (
                                  <span className="text-gray-500">@{r.author.username}</span>
                                )}
                                {r.author.removedPostCount > 0 && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      repeat
                                        ? "bg-red-600 text-white"
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {repeat ? `${t("moderation.repeatOffender")} · ` : ""}
                                    {removedText(r.author.removedPostCount)}
                                  </span>
                                )}
                                {r.author.suspended && (
                                  <span className="px-2 py-0.5 rounded-full bg-gray-800 text-white text-xs">
                                    {t("moderation.suspendedBadge")}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-500">
                                {t("moderation.unknownAuthor")}
                              </span>
                            )}
                            <span className="text-gray-400">
                              ·{" "}
                              {t("moderation.posted", { time: relativeTime(r.createdAt) })}
                            </span>
                          </div>

                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words bg-gray-50 border rounded-md p-3">
                            {r.content}
                            {r.imageCount > 0 && (
                              <span className="block mt-1 text-xs text-gray-500">
                                {t(
                                  plural(r.imageCount) === "one"
                                    ? "moderation.imageCount.one"
                                    : "moderation.imageCount.other",
                                  { count: number(r.imageCount) }
                                )}
                              </span>
                            )}
                          </p>

                          {r.notes.length > 0 && (
                            <ul className="space-y-1">
                              {r.notes.map((note, i) => (
                                <li key={i} className="text-xs text-gray-600 italic">
                                  “{note}”
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <ModerationButton
                              variant="ghost"
                              href={`/feed/${r.postId}`}
                              icon={<ExternalLink className="w-3.5 h-3.5" />}
                            >
                              {t("moderation.viewPost")}
                            </ModerationButton>
                            <ModerationButton
                              variant="success"
                              icon={<Check className="w-3.5 h-3.5" />}
                              loading={busyKey === `dismiss:${r.postId}`}
                              onClick={() => dismiss(r.postId)}
                            >
                              {t("moderation.dismiss")}
                            </ModerationButton>
                            {r.author && !r.author.isAdmin && !r.author.suspended && (
                              <ModerationButton
                                variant={repeat ? "danger-outline" : "warning"}
                                icon={<Ban className="w-3.5 h-3.5" />}
                                loading={busyKey === `suspend:${r.author._id}`}
                                onClick={() => handleSuspend(r)}
                              >
                                {t("moderation.suspendAuthor")}
                              </ModerationButton>
                            )}
                            <ModerationButton
                              variant="danger"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              loading={busyKey === `remove:${r.postId}`}
                              onClick={() => handleRemove(r)}
                            >
                              {t("moderation.removePost")}
                            </ModerationButton>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : suspended.length === 0 ? (
              <p className="text-sm text-gray-500">{t("moderation.noSuspended")}</p>
            ) : (
              <div className="space-y-3">
                {suspended.map((u) => (
                  <Card key={u._id}>
                    <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm">
                        <Link
                          href={`/users/${u._id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {u.name}
                        </Link>
                        {u.username && <span className="text-gray-500"> @{u.username}</span>}
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t("moderation.suspendedLine", {
                            time: relativeTime(u.suspendedAt),
                            removed: removedText(u.removedPostCount),
                          })}
                        </p>
                        {u.suspensionReason && (
                          <p className="text-xs text-gray-600 italic mt-0.5">
                            “{u.suspensionReason}”
                          </p>
                        )}
                      </div>
                      <ModerationButton
                        variant="success"
                        icon={<ShieldCheck className="w-3.5 h-3.5" />}
                        loading={busyKey === `unsuspend:${u._id}`}
                        onClick={() => unsuspend(u._id)}
                      >
                        {t("moderation.lift")}
                      </ModerationButton>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Mainlayout>
  );
};

export default ModerationPage;