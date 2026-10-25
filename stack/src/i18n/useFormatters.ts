import { useMemo } from "react";
import { useLanguage } from "./LanguageContext";

type DateInput = string | number | Date;

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

// Dates, relative times ("3 days ago"), numbers and singular/plural in the active language
export function useFormatters() {
  const { locale } = useLanguage();

  return useMemo(() => {
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const dateOnly = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
    const dateAndTime = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const numbers = new Intl.NumberFormat(locale);
    const pluralRules = new Intl.PluralRules(locale);

    return {
      date: (value: DateInput) => dateOnly.format(new Date(value)),
      dateTime: (value: DateInput) => dateAndTime.format(new Date(value)),
      number: (value: number) => numbers.format(value),
      // "one" or "other", following each language's own rules
      plural: (count: number): "one" | "other" =>
        pluralRules.select(count) === "one" ? "one" : "other",
      relativeTime: (value: DateInput) => {
        const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
        if (Math.abs(seconds) < 30) return relative.format(0, "second"); // "now"
        for (const [unit, size] of UNITS) {
          if (Math.abs(seconds) >= size) {
            return relative.format(Math.round(seconds / size), unit);
          }
        }
        return relative.format(0, "second");
      },
    };
  }, [locale]);
}