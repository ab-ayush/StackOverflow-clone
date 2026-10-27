import { useMemo } from "react";
import { Download, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "@/src/lib/AuthContext";
import { usePayments } from "@/src/lib/usePayments";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import type { TranslationKey } from "@/src/i18n/translate";
import PremiumButton from "./PremiumButton";

const planNameKeys: Record<string, TranslationKey> = {
  bronze: "plans.name.bronze",
  silver: "plans.name.silver",
  gold: "plans.name.gold",
};

export default function PaymentHistory() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { date } = useFormatters();
  const { payments, loading, busyId, download, emailInvoice } =
    usePayments(!!user);

  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency: "INR" }),
    [locale],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("payments.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        ) : payments.length === 0 ? (
          <p className="text-sm text-gray-500">{t("payments.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">
                    {t("payments.colDate")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("payments.colPlan")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("payments.colPeriod")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("payments.colAmount")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("payments.colInvoice")}
                  </th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const busy = busyId === payment._id;
                  return (
                    <tr key={payment._id} className="border-b last:border-0">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {date(payment.paidAt)}
                      </td>
                      <td className="py-3 pr-4">
                        {planNameKeys[payment.plan]
                          ? t(planNameKeys[payment.plan])
                          : payment.plan}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-gray-600">
                        {t("payments.period", {
                          from: date(payment.periodStart),
                          to: date(payment.periodEnd),
                        })}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {money.format(payment.amount / 100)}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap font-mono text-xs">
                        {payment.invoiceNumber || "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <PremiumButton
                            size="sm"
                            variant="primary"
                            icon={<Download className="h-3.5 w-3.5" />}
                            loading={busy}
                            onClick={() => download(payment)}
                          >
                            {t("payments.download")}
                          </PremiumButton>
                          <PremiumButton
                            size="sm"
                            variant="outline"
                            icon={<Mail className="h-3.5 w-3.5" />}
                            disabled={busy}
                            onClick={() => emailInvoice(payment)}
                          >
                            {t("payments.email")}
                          </PremiumButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
