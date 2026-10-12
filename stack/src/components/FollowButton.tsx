import { Check, Loader2, UserMinus, UserPlus } from "lucide-react";

interface FollowButtonProps {
  following: boolean;
  onClick: () => void;
  loading?: boolean;
  size?: "sm" | "md";
}

export default function FollowButton({
  following,
  onClick,
  loading = false,
  size = "sm",
}: FollowButtonProps) {
  const sizing =
    size === "sm"
      ? "h-7 min-w-[88px] px-3 text-xs"
      : "h-9 min-w-[110px] px-5 text-sm";
  const icon = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={following ? "Unfollow" : "Follow"}
      className={`group inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${sizing} ${
        following
          ? "border border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
          : "bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md hover:-translate-y-px"
      }`}
    >
      {loading ? (
        <Loader2 className={`${icon} animate-spin`} />
      ) : following ? (
        <>
          <span className="inline-flex items-center gap-1 group-hover:hidden">
            <Check className={icon} />
            Following
          </span>
          <span className="hidden items-center gap-1 group-hover:inline-flex">
            <UserMinus className={icon} />
            Unfollow
          </span>
        </>
      ) : (
        <span className="inline-flex items-center gap-1">
          <UserPlus className={icon} />
          Follow
        </span>
      )}
    </button>
  );
}