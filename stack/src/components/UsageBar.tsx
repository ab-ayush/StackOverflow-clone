import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";

export default function UsageBar({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null; // null = unlimited
}) {
  const { t } = useLanguage();
  const { number } = useFormatters();
  const unlimited = limit === null;
  const full = !unlimited && used >= limit;
  const percent = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className={full ? "font-medium text-red-600" : "text-gray-600"}>
          {unlimited
            ? t("sub.unlimited")
            : t("sub.usageOf", { used: number(used), limit: number(limit) })}
        </span>
      </div>
      {!unlimited && (
        <div className="mt-1 h-2 rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${full ? "bg-red-500" : "bg-blue-600"}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}