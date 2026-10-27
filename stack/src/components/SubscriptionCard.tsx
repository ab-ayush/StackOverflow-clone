import {
  CalendarDays,
  Crown,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import PlanBadge from "./PlanBadge";
import UsageBar from "./UsageBar";
import PremiumButton from "./PremiumButton";
import { useAuth } from "@/src/lib/AuthContext";
import { useSubscription } from "@/src/lib/useSubscription";
import { useUsage } from "@/src/lib/useUsage";
import { useRazorpayCheckout } from "@/src/lib/useRazorpayCheckout";
import { PLAN_ORDER, PaidPlanId, PlanId, tierOf } from "@/src/lib/plans";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import type { TranslationKey } from "@/src/i18n/translate";

const nameKeys: Record<PlanId, TranslationKey> = {
  free: "plans.name.free",
  bronze: "plans.name.bronze",
  silver: "plans.name.silver",
  gold: "plans.name.gold",
};

const statusKeys: Record<"active" | "expired" | "free", TranslationKey> = {
  active: "sub.status.active",
  expired: "sub.status.expired",
  free: "sub.status.free",
};

const statusStyles: Record<"active" | "expired" | "free", string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  free: "bg-gray-100 text-gray-700",
};

// the coloured header of the card follows the plan
const bandStyles: Record<PlanId, string> = {
  free: "from-slate-600 to-slate-800",
  bronze: "from-amber-600 to-orange-700",
  silver: "from-slate-400 to-slate-600",
  gold: "from-yellow-400 to-amber-600",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default function SubscriptionCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { date, number, plural } = useFormatters();
  const { mine, refresh: refreshSubscription } = useSubscription();
  const { usage, refresh: refreshUsage } = useUsage(!!user);
  const { pay, busyPlan } = useRazorpayCheckout(async () => {
    await refreshSubscription();
    await refreshUsage();
  });

  if (!mine) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        </CardContent>
      </Card>
    );
  }

  const planName = (id: PlanId) => t(nameKeys[id]);
  const daysLeft = mine.expiresAt
    ? Math.max(0, Math.ceil((new Date(mine.expiresAt).getTime() - Date.now()) / DAY_MS))
    : 0;
  const expiringSoon = mine.status === "active" && daysLeft <= 3;

  // the plan the user last bought can be renewed, active or expired
  const renewPlan = mine.storedPlan !== "free" ? (mine.storedPlan as PaidPlanId) : null;
  // the next plan up (skipped when it would be the same button as Renew)
  const next = PLAN_ORDER[tierOf(mine.plan) + 1] as PaidPlanId | undefined;
  const upgradePlan = next && next !== renewPlan ? next : null;

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-r ${bandStyles[mine.plan]} px-6 py-5 text-white`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">
              {t("sub.title")}
            </p>
            <h3 className="mt-1 text-2xl font-bold">{planName(mine.plan)}</h3>
          </div>
          <div className="flex items-center gap-3">
            <Crown className="h-9 w-9 text-white/40" />
            <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold backdrop-blur">
              {t(statusKeys[mine.status])}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="space-y-6 p-6">
        {mine.status === "expired" && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {t("sub.expiredNotice", { plan: planName(mine.storedPlan) })}
          </p>
        )}
        {expiringSoon && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t("sub.expiringSoon", { plan: planName(mine.plan) })}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border bg-gray-50 p-4">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("sub.statusLabel")}</p>
              <span
                className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[mine.status]}`}
              >
                {t(statusKeys[mine.status])}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border bg-gray-50 p-4">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{t("sub.renewalDate")}</p>
              {mine.status === "active" ? (
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {date(mine.expiresAt as string)}
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {t(
                      plural(daysLeft) === "one" ? "sub.daysLeft.one" : "sub.daysLeft.other",
                      { count: number(daysLeft) }
                    )}
                  </span>
                </p>
              ) : mine.status === "expired" ? (
                <p className="mt-1 text-sm font-medium text-red-700">
                  {t("sub.expiredOn", { date: date(mine.expiresAt as string) })}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">{t("sub.noRenewal")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">{t("sub.usage")}</h4>
          <UsageBar
            label={t("sub.questionsToday")}
            used={usage?.questions.used ?? 0}
            limit={usage ? usage.questions.limit : null}
          />
          <UsageBar
            label={t("sub.bookmarksSaved")}
            used={usage?.bookmarks.used ?? 0}
            limit={usage ? usage.bookmarks.limit : null}
          />
          {usage && usage.questions.limit !== null && (
            <p className="text-xs text-gray-500">{t("limits.resets")}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 border-t pt-5">
          {renewPlan && (
            <PremiumButton
              variant="primary"
              icon={<RefreshCw className="h-4 w-4" />}
              loading={busyPlan === renewPlan}
              disabled={!!busyPlan}
              onClick={() => pay(renewPlan, planName(renewPlan))}
            >
              {t("pricing.renew", { plan: planName(renewPlan) })}
            </PremiumButton>
          )}
          {upgradePlan && (
            <PremiumButton
              variant={renewPlan ? "gold" : "primary"}
              icon={<Crown className="h-4 w-4" />}
              loading={busyPlan === upgradePlan}
              disabled={!!busyPlan}
              onClick={() => pay(upgradePlan, planName(upgradePlan))}
            >
              {t(mine.plan === "free" ? "pricing.get" : "pricing.upgrade", {
                plan: planName(upgradePlan),
              })}
            </PremiumButton>
          )}
          <PremiumButton
            variant="outline"
            href="/pricing"
            icon={<Sparkles className="h-4 w-4" />}
          >
            {mine.plan === "free" && !renewPlan ? t("sub.choosePlan") : t("sub.viewPlans")}
          </PremiumButton>
          <PremiumButton
            variant="soft"
            href="/billing"
            icon={<Receipt className="h-4 w-4" />}
          >
            {t("payments.viewBilling")}
          </PremiumButton>
        </div>
      </CardContent>
    </Card>
  );
}