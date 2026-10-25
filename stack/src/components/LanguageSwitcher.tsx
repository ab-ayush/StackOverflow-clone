import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { LANGUAGES, LanguageCode } from "@/src/i18n/config";
import { useLanguage } from "@/src/i18n/LanguageContext";
import LanguageChangeDialog from "./LanguageChangeDialog";

export default function LanguageSwitcher() {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<LanguageCode | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === language);

  // choosing another language starts the verification dialog; nothing changes yet
  const choose = (code: LanguageCode) => {
    setOpen(false);
    if (code !== language) setPending(code);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("nav.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-[#454545] hover:bg-gray-100 transition"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{current?.nativeLabel}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg z-50"
        >
          <p className="px-3 py-1.5 text-xs text-gray-500">{t("language.menuTitle")}</p>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === language}
              onClick={() => choose(l.code)}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 ${
                l.code === language ? "font-semibold text-blue-600" : "text-gray-800"
              }`}
            >
              {l.nativeLabel}
              {l.code === language && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}

      {pending && (
        <LanguageChangeDialog
          key={pending}
          target={pending}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}