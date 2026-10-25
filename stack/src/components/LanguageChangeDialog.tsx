import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Mail, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAuth } from "@/src/lib/AuthContext";
import axiosInstance from "@/src/lib/axiosinstance";
import { LANGUAGES, LanguageCode } from "@/src/i18n/config";
import { useLanguage } from "@/src/i18n/LanguageContext";
import type { TranslationKey } from "@/src/i18n/translate";

type Step = "checking" | "intro" | "code" | "done";

interface LanguageStatus {
  channel: "email" | "sms" | null;
  hasPhone: boolean;
  maskedPhone: string | null;
  maskedEmail: string;
}

// the server answers failures with a code, shown here in the user's own language
const ERROR_KEYS: Record<string, TranslationKey> = {
  INVALID_PHONE: "language.error.invalidPhone",
  COOLDOWN: "language.error.cooldown",
  TOO_MANY_REQUESTS: "language.error.tooManyRequests",
  PHONE_LIMIT: "language.error.tooManyRequests",
  SEND_FAILED: "language.error.sendFailed",
  BAD_CODE_FORMAT: "language.error.badCodeFormat",
  NO_ACTIVE_CODE: "language.error.noActiveCode",
  WRONG_LANGUAGE: "language.error.wrongLanguage",
  CODE_EXPIRED: "language.error.codeExpired",
  CODE_INCORRECT: "language.error.codeIncorrect",
  TOO_MANY_ATTEMPTS: "language.error.tooManyAttempts",
  SAME_LANGUAGE: "language.error.sameLanguage",
};

const errorKeyFor = (code?: string): TranslationKey =>
  (code && ERROR_KEYS[code]) || "language.error.generic";

const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 h-9 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";
const neutralButton =
  "inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 h-9 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";
const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function LanguageChangeDialog({
  target,
  onClose,
}: {
  target: LanguageCode;
  onClose: () => void;
}) {
  const { user, updateUser } = useAuth();
  const { t, applyVerifiedLanguage } = useLanguage();
  const targetLabel = LANGUAGES.find((l) => l.code === target)?.nativeLabel ?? target;

  const [step, setStep] = useState<Step>("checking");
  const [status, setStatus] = useState<LanguageStatus | null>(null);
  const [phone, setPhone] = useState("");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // find out where the code will go
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axiosInstance.get("/language/status", {
          params: { language: target },
        });
        if (!cancelled) setStatus(res.data);
      } catch (error) {
        if (!cancelled) setErrorKey("language.error.generic");
      } finally {
        if (!cancelled) setStep("intro");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?._id, target]);

  // resend countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const needsPhone = status?.channel === "sms" && !status.hasPhone;

  const requestCode = async () => {
    setBusy(true);
    setErrorKey(null);
    setAttemptsLeft(null);
    try {
      const body: Record<string, string> = { language: target };
      if (needsPhone) body.phone = phone;
      const res = await axiosInstance.post("/language/request-otp", body);
      setDestination(res.data.destination);
      setCooldown(res.data.resendAfterSeconds ?? 30);
      setCode("");
      setStep("code");
    } catch (error: any) {
      const data = error.response?.data;
      setErrorKey(errorKeyFor(data?.code));
      if (data?.code === "COOLDOWN" && data.retryAfterSeconds) {
        setCooldown(data.retryAfterSeconds);
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code) || busy) return;
    setBusy(true);
    setErrorKey(null);
    try {
      await axiosInstance.post("/language/verify-otp", { language: target, code });
      applyVerifiedLanguage(target);
      updateUser({ preferredLanguage: target });
      setStep("done");
      setTimeout(onClose, 1200);
    } catch (error: any) {
      const data = error.response?.data;
      setErrorKey(errorKeyFor(data?.code));
      setAttemptsLeft(
        data?.code === "CODE_INCORRECT" && typeof data.attemptsLeft === "number"
          ? data.attemptsLeft
          : null
      );
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const errorText = errorKey && (
    <p className="text-sm text-red-600" role="alert">
      {t(errorKey)}
    </p>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white text-gray-900">
        {!user ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("language.dialog.loginTitle")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">{t("language.dialog.loginBody")}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={neutralButton} onClick={onClose}>
                {t("language.dialog.cancel")}
              </button>
              <Link href="/auth" onClick={onClose} className={primaryButton}>
                {t("language.dialog.loginButton")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("language.dialog.title", { language: targetLabel })}</DialogTitle>
            </DialogHeader>

            {step === "checking" && (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("language.dialog.checking")}
              </div>
            )}

            {step === "intro" && (
              <div className="space-y-4">
                {status ? (
                  <>
                    <div className="flex gap-3 text-sm text-gray-700">
                      {status.channel === "email" ? (
                        <Mail className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                      ) : (
                        <MessageSquare className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
                      )}
                      <p>
                        {status.channel === "email"
                          ? t("language.dialog.emailIntro", { destination: status.maskedEmail })
                          : status.hasPhone
                          ? t("language.dialog.smsIntro", {
                              destination: status.maskedPhone ?? "",
                            })
                          : t("language.dialog.phoneIntro")}
                      </p>
                    </div>

                    {needsPhone && (
                      <div className="space-y-1">
                        <label htmlFor="language-phone" className="text-sm font-medium">
                          {t("language.dialog.phoneLabel")}
                        </label>
                        <input
                          id="language-phone"
                          type="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t("language.dialog.phonePlaceholder")}
                          className={inputClass}
                        />
                        <p className="text-xs text-gray-500">{t("language.dialog.phoneHint")}</p>
                      </div>
                    )}
                  </>
                ) : null}

                {errorText}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" className={neutralButton} onClick={onClose}>
                    {t("language.dialog.cancel")}
                  </button>
                  {status && (
                    <button
                      type="button"
                      className={primaryButton}
                      onClick={requestCode}
                      disabled={busy || (needsPhone && !phone.trim())}
                    >
                      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                      {busy ? t("language.dialog.sending") : t("language.dialog.sendCode")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === "code" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700">
                  {t("language.dialog.codeSent", { destination })}
                </p>

                <div className="space-y-1">
                  <label htmlFor="language-code" className="text-sm font-medium">
                    {t("language.dialog.codeLabel")}
                  </label>
                  <input
                    id="language-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && verify()}
                    placeholder="••••••"
                    className={`${inputClass} text-center text-xl tracking-[0.5em]`}
                  />
                </div>

                {errorText}
                {attemptsLeft !== null && (
                  <p className="text-xs text-gray-500">
                    {t("language.dialog.attemptsLeft", { count: attemptsLeft })}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                    onClick={requestCode}
                    disabled={busy || cooldown > 0}
                  >
                    {cooldown > 0
                      ? t("language.dialog.resendIn", { seconds: cooldown })
                      : t("language.dialog.resend")}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" className={neutralButton} onClick={onClose}>
                      {t("language.dialog.cancel")}
                    </button>
                    <button
                      type="button"
                      className={primaryButton}
                      onClick={verify}
                      disabled={busy || code.length !== 6}
                    >
                      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                      {busy ? t("language.dialog.verifying") : t("language.dialog.verify")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "done" && (
              <div className="flex items-center gap-2 py-4 text-green-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">{t("language.dialog.success")}</span>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}