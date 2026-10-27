import { Medal } from "lucide-react";
import { useLanguage } from "@/src/i18n/LanguageContext";
import type { TranslationKey } from "@/src/i18n/translate";
import type { PlanId } from "@/src/lib/plans";

const nameKeys: Record<"bronze" | "silver" | "gold", TranslationKey> = {
  bronze: "plans.name.bronze",
  silver: "plans.name.silver",
  gold: "plans.name.gold",
};

const styles: Record<"bronze" | "silver" | "gold", string> = {
  bronze: "bg-amber-100 text-amber-800 border-amber-300",
  silver: "bg-gray-100 text-gray-700 border-gray-300",
  gold: "bg-yellow-100 text-yellow-800 border-yellow-400",
};

export default function PlanBadge({
  plan,
  size = "sm",
}: {
  plan?: PlanId | null;
  size?: "sm" | "md";
}) {
  const { t } = useLanguage();
  if (!plan || plan === "free") return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${styles[plan]} ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <Medal className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {t(nameKeys[plan])}
    </span>
  );
}