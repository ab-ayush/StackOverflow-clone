import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/src/lib/AuthContext";
import { BillingDetails, EMPTY_BILLING, useBilling } from "@/src/lib/useBilling";
import { useLanguage } from "@/src/i18n/LanguageContext";
import type { TranslationKey } from "@/src/i18n/translate";
import PremiumButton from "./PremiumButton";

const FIELDS: {
  key: keyof BillingDetails;
  label: TranslationKey;
  required: boolean;
  wide?: boolean;
  maxLength?: number;
}[] = [
  { key: "fullName", label: "billing.fullName", required: true, wide: true },
  { key: "addressLine1", label: "billing.addressLine1", required: true, wide: true },
  { key: "addressLine2", label: "billing.addressLine2", required: false, wide: true },
  { key: "city", label: "billing.city", required: true },
  { key: "state", label: "billing.state", required: true },
  { key: "postalCode", label: "billing.postalCode", required: true, maxLength: 10 },
  { key: "country", label: "billing.country", required: true },
  { key: "gstin", label: "billing.gstin", required: false, maxLength: 15 },
];

export default function BillingDetailsForm() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { billing, loading, saving, save } = useBilling(!!user);
  const [values, setValues] = useState<BillingDetails>(EMPTY_BILLING);

  useEffect(() => {
    if (loading) return;
    setValues(
      billing
        ? { ...EMPTY_BILLING, ...billing }
        : { ...EMPTY_BILLING, fullName: user?.name || "" }
    );
  }, [billing, loading, user?.name]);

  const ready = FIELDS.filter((f) => f.required).every((f) => values[f.key].trim());

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("billing.detailsTitle")}</CardTitle>
        <p className="text-sm text-gray-600">{t("billing.detailsHint")}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (ready) save(values);
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            {FIELDS.map((field) => (
              <div key={field.key} className={field.wide ? "sm:col-span-2" : ""}>
                <Label htmlFor={`billing-${field.key}`}>
                  {t(field.label)}
                  {field.required && <span className="text-red-500"> *</span>}
                </Label>
                <Input
                  id={`billing-${field.key}`}
                  value={values[field.key]}
                  maxLength={field.maxLength ?? 120}
                  onChange={(e) =>
                    setValues({
                      ...values,
                      [field.key]:
                        field.key === "gstin" ? e.target.value.toUpperCase() : e.target.value,
                    })
                  }
                />
                {field.key === "gstin" && (
                  <p className="mt-1 text-xs text-gray-500">{t("billing.gstinHint")}</p>
                )}
              </div>
            ))}

            <div className="sm:col-span-2">
                            <PremiumButton
                type="submit"
                icon={<Save className="h-4 w-4" />}
                loading={saving}
                disabled={!ready}
              >
                {saving ? t("billing.saving") : t("billing.save")}
              </PremiumButton>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}