import { useEffect, useState } from "react";
import Link from "next/link";
import Mainlayout from "@/src/layout/Mainlayout";
import { useAuth } from "@/src/lib/AuthContext";
import PaymentHistory from "@/src/components/PaymentHistory";
import BillingDetailsForm from "@/src/components/BillingDetailsForm";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { formatWithElements } from "@/src/i18n/format";

export default function BillingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Mainlayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 lg:text-2xl">
            {t("billing.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">{t("billing.subtitle")}</p>
        </div>

        {!mounted ? null : !user ? (
          <p className="text-sm text-gray-600">
            {formatWithElements(t("billing.loginRequired"), {
              login: (
                <Link href="/auth" className="text-blue-600 hover:underline">
                  {t("nav.login")}
                </Link>
              ),
            })}
          </p>
        ) : (
          <>
            <PaymentHistory />
            <BillingDetailsForm />
          </>
        )}
      </div>
    </Mainlayout>
  );
}