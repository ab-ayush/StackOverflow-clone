import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "primary" | "gold" | "outline" | "soft";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/40",
  gold:
    "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/40",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700",
  soft: "bg-blue-50 text-blue-700 hover:bg-blue-100",
};

const sizes = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

interface PremiumButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  variant?: Variant;
  size?: "md" | "sm";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  href?: string;
  onClick?: () => void;
  className?: string;
}

export default function PremiumButton({
  children,
  icon,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  type = "button",
  href,
  onClick,
  className = "",
}: PremiumButtonProps) {
  const classes = `group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${sizes[size]} ${variants[variant]} ${className}`;

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
      ) : null}
      <span>{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={classes}>
      {content}
    </button>
  );
}