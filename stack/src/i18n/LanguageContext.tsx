import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import axiosInstance from "@/src/lib/axiosinstance";
import { useAuth } from "@/src/lib/AuthContext";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  LanguageCode,
  isLanguageCode,
  localeFor,
} from "./config";
import { translate, TranslationKey, TranslationVars } from "./translate";

interface LanguageContextValue {
  language: LanguageCode;
  locale: string;
  // only the verification dialog calls this, after the server has accepted the code
  applyVerifiedLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey, vars?: TranslationVars) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: LanguageCode;
  children: ReactNode;
}) {
  const { user, updateUser } = useAuth();
  const userId: string | undefined = user?._id;
  const storedLanguage: unknown = user?.preferredLanguage;

  const [language, setLanguageState] = useState<LanguageCode>(initialLanguage);
  const languageRef = useRef(language);
  languageRef.current = language;

  const applyLanguage = useCallback((code: LanguageCode) => {
    if (!isLanguageCode(code)) return;
    // the cookie only lets the server render the right language on the next page load.
    // Who may use which language is decided by the account, see the effect below
    document.cookie = `${LANGUAGE_COOKIE}=${code}; path=/; max-age=${YEAR_SECONDS}; SameSite=Lax`;
    setLanguageState(code);
  }, []);

  // The saved language belongs to the account:
  //  - logged out: English only (changing it needs a verified account)
  //  - logged in: the language saved on the account, confirmed with the server.
  // This also corrects a hand-edited cookie.
  useEffect(() => {
    if (!userId) {
      if (languageRef.current !== DEFAULT_LANGUAGE) applyLanguage(DEFAULT_LANGUAGE);
      return;
    }

    if (isLanguageCode(storedLanguage) && storedLanguage !== languageRef.current) {
      applyLanguage(storedLanguage);
    }

    let cancelled = false;
    const confirmWithServer = async () => {
      try {
        const res = await axiosInstance.get("/language/status");
        const saved = res.data.preferredLanguage;
        if (cancelled || !isLanguageCode(saved)) return;
        if (saved !== languageRef.current) applyLanguage(saved);
        if (saved !== storedLanguage) updateUser({ preferredLanguage: saved });
      } catch (error) {
        // offline or logged out meanwhile: keep what we have
      }
    };
    confirmWithServer();

    return () => {
      cancelled = true;
    };
    // only when somebody logs in or out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    document.documentElement.lang = localeFor(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      locale: localeFor(language),
      applyVerifiedLanguage: applyLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language, applyLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return context;
}