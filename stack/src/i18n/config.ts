export const LANGUAGES = [
  { code: "en", nativeLabel: "English", locale: "en-US" },
  { code: "es", nativeLabel: "Español", locale: "es-ES" },
  { code: "hi", nativeLabel: "हिन्दी", locale: "hi-IN" },
  { code: "pt", nativeLabel: "Português", locale: "pt-BR" },
  { code: "zh", nativeLabel: "中文", locale: "zh-CN" },
  { code: "fr", nativeLabel: "Français", locale: "fr-FR" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const LANGUAGE_COOKIE = "lang";

export const isLanguageCode = (value: unknown): value is LanguageCode =>
  LANGUAGES.some((l) => l.code === value);

export const localeFor = (code: LanguageCode) =>
  LANGUAGES.find((l) => l.code === code)?.locale ?? "en-US";

// reads the saved language out of a raw cookie string (works on the server and in the browser)
export const languageFromCookieString = (cookieString?: string): LanguageCode => {
  if (!cookieString) return DEFAULT_LANGUAGE;
  const entry = cookieString
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LANGUAGE_COOKIE}=`));
  const value = entry?.slice(LANGUAGE_COOKIE.length + 1);
  return isLanguageCode(value) ? value : DEFAULT_LANGUAGE;
};