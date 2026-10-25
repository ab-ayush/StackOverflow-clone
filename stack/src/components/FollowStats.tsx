import FollowButton from "./FollowButton";
import { useFollowStats } from "@/src/lib/useFollowStats";
import { useLanguage } from "@/src/i18n/LanguageContext";
import { useFormatters } from "@/src/i18n/useFormatters";
import { formatWithElements } from "@/src/i18n/format";

export default function FollowStats({
  userId,
  isOwnProfile,
}: {
  userId: string;
  isOwnProfile: boolean;
}) {
  const { t } = useLanguage();
  const { number, plural } = useFormatters();
  const { stats, busy, toggle } = useFollowStats(userId);
  if (!stats) return null;

  const bold = (value: number) => (
    <span className="font-semibold text-gray-900">{number(value)}</span>
  );

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <span>
        {formatWithElements(
          t(
            plural(stats.followerCount) === "one"
              ? "followStats.followers.one"
              : "followStats.followers.other"
          ),
          { count: bold(stats.followerCount) }
        )}
      </span>
      <span>
        {formatWithElements(
          t(
            plural(stats.followingCount) === "one"
              ? "followStats.following.one"
              : "followStats.following.other"
          ),
          { count: bold(stats.followingCount) }
        )}
      </span>
      {!isOwnProfile && (
        <FollowButton
          size="md"
          following={stats.isFollowing}
          loading={busy}
          onClick={toggle}
        />
      )}
    </div>
  );
}