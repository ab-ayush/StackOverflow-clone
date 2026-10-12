import FollowButton from "./FollowButton";
import { useFollowStats } from "@/src/lib/useFollowStats";

export default function FollowStats({
  userId,
  isOwnProfile,
}: {
  userId: string;
  isOwnProfile: boolean;
}) {
  const { stats, busy, toggle } = useFollowStats(userId);
  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <span>
        <span className="font-semibold text-gray-900">{stats.followerCount}</span>{" "}
        {stats.followerCount === 1 ? "follower" : "followers"}
      </span>
      <span>
        <span className="font-semibold text-gray-900">{stats.followingCount}</span> following
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