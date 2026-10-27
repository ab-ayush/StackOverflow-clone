import { useLanguage } from "@/src/i18n/LanguageContext";
import type { TranslationKey } from "@/src/i18n/translate";

const keys: Record<number, TranslationKey> = {
  0: "support.priority.standard",
  1: "support.priority.priority",
  2: "support.priority.priorityCustomer",
};

const styles: Record<number, string> = {
  0: "bg-gray-100 text-gray-700",
  1: "bg-blue-100 text-blue-800",
  2: "bg-yellow-100 text-yellow-900",
};

export default function PriorityChip({ priority }: { priority: number }) {
  const { t } = useLanguage();
  const level = keys[priority] ? priority : 0;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[level]}`}
    >
      {t(keys[level])}
    </span>
  );
}