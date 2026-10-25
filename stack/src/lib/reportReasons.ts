import type { TranslationKey } from "@/src/i18n/translate";

export type ReportReason =
  | "spam"
  | "harassment"
  | "inappropriate"
  | "misinformation"
  | "other";

export const REPORT_REASONS: { value: ReportReason; labelKey: TranslationKey }[] = [
  { value: "spam", labelKey: "report.reason.spam" },
  { value: "harassment", labelKey: "report.reason.harassment" },
  { value: "inappropriate", labelKey: "report.reason.inappropriate" },
  { value: "misinformation", labelKey: "report.reason.misinformation" },
  { value: "other", labelKey: "report.reason.other" },
];

// the translation key for a reason, or undefined for a reason this list doesn't know
export const reasonLabelKey = (value: string): TranslationKey | undefined =>
  REPORT_REASONS.find((r) => r.value === value)?.labelKey;