import type { LanguageCode } from "./config";
import { en } from "./locales/en";
import type { Dictionary } from "./locales/en";
import { es } from "./locales/es";
import { hi } from "./locales/hi";
import { pt } from "./locales/pt";
import { zh } from "./locales/zh";
import { fr } from "./locales/fr";

export type TranslationKey = keyof Dictionary;
export type TranslationVars = Record<string, string | number>;

const dictionaries: Record<LanguageCode, Dictionary> = { en, es, hi, pt, zh, fr };

// looks the key up in the chosen language, falls back to English, then to the key itself
export const translate = (
  language: LanguageCode,
  key: TranslationKey,
  vars?: TranslationVars
): string => {
  const text = dictionaries[language]?.[key] || en[key] || key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    name in vars ? String(vars[name]) : match
  );
};