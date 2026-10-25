import { useSessions } from "@/src/lib/useSession";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import type { TranslationKey } from "@/src/i18n/translate";

const deviceTypeKeys: Record<string, TranslationKey> = {
  desktop: "sessions.deviceType.desktop",
  mobile: "sessions.deviceType.mobile",
  tablet: "sessions.deviceType.tablet",
};

export default function SessionList() {
  const { t } = useLanguage();
  const { dateTime } = useFormatters();
  const { sessions, loading, revoke, revokeAllOthers } = useSessions();

  const otherSessionsExist = sessions.some((s) => !s.isCurrent);

  const deviceLabel = (type: string) => {
    const key = deviceTypeKeys[type];
    return key ? t(key) : type;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("sessions.title")}</CardTitle>
        {otherSessionsExist && (
          <Button
            variant="outline"
            size="sm"
            onClick={revokeAllOthers}
            className="text-red-600 hover:text-red-700 bg-transparent"
          >
            {t("sessions.logoutOthers")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">{t("sessions.loading")}</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("sessions.none")}</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border rounded-md p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("sessions.browserOnOs", { browser: s.browser, os: s.os })}
                    {s.isCurrent && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        {t("sessions.thisDevice")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {deviceLabel(s.deviceType)} · {s.ip}
                    {s.location?.city
                      ? ` · ${s.location.city}, ${s.location.country}`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("sessions.lastActive", { time: dateTime(s.lastActiveAt) })}
                  </p>
                </div>

                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(s.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    {t("sessions.revoke")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}