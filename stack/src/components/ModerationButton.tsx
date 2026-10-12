import type { ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Variant = "danger" | "danger-outline" | "success" | "warning" | "neutral" | "ghost";

const styles: Record<Variant, string> = {
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md hover:-translate-y-px",
  "danger-outline":
    "border border-red-300 bg-white text-red-600 hover:bg-red-50 hover:border-red-400",
  success:
    "border border-green-300 bg-white text-green-700 hover:bg-green-50 hover:border-green-400",
  warning:
    "border border-orange-300 bg-white text-orange-700 hover:bg-orange-50 hover:border-orange-400",
  neutral:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400",
  ghost: "text-gray-600 hover:bg-gray-100",
};

interface ModerationButtonProps {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  href?: string; // renders a link that opens in a new tab instead of a button
  onClick?: () => void;
  children: ReactNode;
}

export default function ModerationButton({
  variant = "neutral",
  size = "sm",
  icon,
  loading = false,
  disabled = false,
  href,
  onClick,
  children,
}: ModerationButtonProps) {
  const sizing = size === "sm" ? "h-8 px-3.5 text-xs gap-1.5" : "h-9 px-5 text-sm gap-2";
  const classes = `inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${sizing} ${styles[variant]}`;

  if (href) {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {icon}
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
}