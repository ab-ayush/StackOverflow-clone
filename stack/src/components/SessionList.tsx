import { useSessions } from "@/src/lib/useSession";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

export default function SessionList() {
  const { sessions, loading, revoke, revokeAllOthers } = useSessions();

  const otherSessionsExist = sessions.some((s) => !s.isCurrent);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Active Devices</CardTitle>
        {otherSessionsExist && (
          <Button
            variant="outline"
            size="sm"
            onClick={revokeAllOthers}
            className="text-red-600 hover:text-red-700 bg-transparent"
          >
            Log out other devices
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-500">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No active sessions found.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between border rounded-md p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {s.browser} on {s.os}
                    {s.isCurrent && (
                      <span className="ml-2 text-xs text-green-600 font-normal">
                        (this device)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.deviceType} · {s.ip}
                    {s.location?.city
                      ? ` · ${s.location.city}, ${s.location.country}`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    Last active {new Date(s.lastActiveAt).toLocaleString()}
                  </p>
                </div>

                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoke(s.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Revoke
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