import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import { useSubscription } from "@/src/lib/useSubscription";
import { useRazorpayCheckout } from "@/src/lib/useRazorpayCheckout";
import { PaidPlanId, PlanId, PlanInfo, tierOf } from "@/src/lib/plans";
import PlanBadge from "@/src/components/PlanBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import type { TranslationKey } from "@/src/i18n/translate";

const nameKeys: Record<PlanId, TranslationKey> = {
  free: "plans.name.free",
  bronze: "plans.name.bronze",
  silver: "plans.name.silver",
  gold: "plans.name.gold",
};

const accent: Record<PlanId, string> = {
  free: "border-gray-200",
  bronze: "border-amber-300",
  silver: "border-gray-400",
  gold: "border-yellow-400 shadow-md",
};

export default function PricingPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { date, number, plural } = useFormatters();
  const { plans, mine, loading, refresh } = useSubscription();
  const { pay, busyPlan } = useRazorpayCheckout(refresh);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && !!user;
  const hasAccount = loggedIn && !!mine;
  const currentPlan: PlanId = hasAccount ? mine!.plan : "free";
  const currentTier = tierOf(currentPlan);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const featureLines = (plan: PlanInfo) => {
    const lines: string[] = [];

    lines.push(
      plan.questionsPerDay === null
        ? t("plans.feature.questionsUnlimited")
        : t(
            plural(plan.questionsPerDay) === "one"
              ? "plans.feature.questions.one"
              : "plans.feature.questions.other",
            { count: number(plan.questionsPerDay) }
          )
    );
    lines.push(
      plan.advancedSearch
        ? t("plans.feature.advancedSearch")
        : t("plans.feature.basicSearch")
    );
    if (plan.searchBoost) lines.push(t("plans.feature.searchBoost"));
    if (plan.badge) {
      lines.push(t("plans.feature.badge", { plan: t(nameKeys[plan.id]) }));
    }
    lines.push(
      plan.bookmarkLimit === null
        ? t("plans.feature.bookmarks.unlimited")
        : t("plans.feature.bookmarks.limit", { count: number(plan.bookmarkLimit) })
    );
    if (plan.visibility === "enhanced") lines.push(t("plans.feature.visibility.enhanced"));
    if (plan.visibility === "featured") lines.push(t("plans.feature.visibility.featured"));
    if (plan.support === "priority") lines.push(t("plans.feature.support.priority"));
    if (plan.support === "priorityCustomer") {
      lines.push(t("plans.feature.support.priorityCustomer"));
    }
    if (plan.exclusive) lines.push(t("plans.feature.exclusive"));

    return lines;
  };

  const statusLine = !hasAccount
    ? null
    : mine!.status === "active"
    ? t("pricing.activeUntil", {
        plan: t(nameKeys[mine!.plan]),
        date: date(mine!.expiresAt as string),
      })
    : mine!.status === "expired"
    ? t("pricing.expiredNotice", {
        plan: t(nameKeys[mine!.storedPlan]),
        date: date(mine!.expiresAt as string),
      })
    : t("pricing.onFree");

  const action = (plan: PlanInfo) => {
    if (plan.id === "free") {
      return <p className="text-sm text-gray-500">{t("pricing.freeForever")}</p>;
    }
    const paidId = plan.id as PaidPlanId;
    const name = t(nameKeys[plan.id]);

    if (!loggedIn) {
      return (
        <Link
          href="/auth"
          className="block w-full rounded-md border border-blue-500 bg-[#e7f8fe] px-4 py-2 text-center text-sm font-medium text-[#454545] hover:bg-[#d3e4eb]"
        >
          {t("pricing.loginToSubscribe")}
        </Link>
      );
    }
    if (tierOf(plan.id) < currentTier) {
      return (
        <Button disabled variant="outline" className="w-full">
          {t("pricing.higherActive")}
        </Button>
      );
    }

    const label =
      plan.id === currentPlan
        ? t("pricing.renew", { plan: name })
        : currentTier === 0
        ? t("pricing.get", { plan: name })
        : t("pricing.upgrade", { plan: name });

    return (
      <Button
        onClick={() => pay(paidId, name)}
        disabled={!!busyPlan || !mine}
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
      >
        {busyPlan === paidId ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("pricing.processing")}
          </>
        ) : (
          label
        )}
      </Button>
    );
  };

  return (
    <Mainlayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">
            {t("pricing.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">{t("pricing.subtitle")}</p>
          {statusLine && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
              <PlanBadge plan={mine!.plan} />
              {statusLine}
            </p>
          )}
                    {loggedIn && (
            <Link
              href="/billing"
              className="mt-2 block text-sm text-blue-600 hover:underline"
            >
              {t("payments.viewBilling")}
            </Link>
          )}
        </div>

        {loading ? (
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = hasAccount && plan.id === currentPlan;
              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col border-2 ${accent[plan.id]} ${
                    isCurrent ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{t(nameKeys[plan.id])}</span>
                      {isCurrent ? (
                        <span className="text-xs font-medium text-blue-600">
                          {t("pricing.currentPlan")}
                        </span>
                      ) : (
                        <PlanBadge plan={plan.id} />
                      )}
                    </CardTitle>
                    <p className="pt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        {money.format(plan.priceInr)}
                      </span>{" "}
                      {plan.id !== "free" && (
                        <span className="text-sm text-gray-500">
                          {t("pricing.perMonth")}
                        </span>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-6">
                    <ul className="space-y-2 text-sm text-gray-700">
                      {featureLines(plan).map((line) => (
                        <li key={line} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          {line}
                        </li>
                      ))}
                    </ul>
                    {action(plan)}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-500">{t("pricing.secureNote")}</p>
      </div>
    </Mainlayout>
  );
}