import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "gold" | "brand";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const badgeVariants = {
  default: {
    container: "bg-slate-100 text-slate-700 border-slate-200/90",
    dot: "bg-slate-400",
  },
  neutral: {
    container: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  success: {
    container: "bg-emerald-50/90 text-emerald-800 border-emerald-300/80 shadow-[0_0_10px_rgba(16,185,129,0.12)]",
    dot: "bg-emerald-500",
  },
  warning: {
    container: "bg-amber-50/90 text-amber-900 border-amber-300/80 shadow-[0_0_10px_rgba(245,158,11,0.12)]",
    dot: "bg-amber-500",
  },
  danger: {
    container: "bg-rose-50/90 text-rose-800 border-rose-300/80 shadow-[0_0_10px_rgba(244,63,94,0.12)]",
    dot: "bg-rose-500",
  },
  info: {
    container: "bg-cyan-50/90 text-cyan-800 border-cyan-300/80 shadow-[0_0_10px_rgba(6,182,212,0.12)]",
    dot: "bg-cyan-500",
  },
  brand: {
    container: "bg-brand-50/90 text-brand-800 border-brand-300/80 shadow-[0_0_10px_rgba(99,102,241,0.15)]",
    dot: "bg-brand-500",
  },
  gold: {
    container: "bg-amber-50 text-amber-950 border-amber-300/80",
    dot: "bg-amber-600",
  },
};

const Badge = ({
  children,
  variant = "default",
  size = "md",
  dot = true,
  className = "",
}: BadgeProps) => {
  const currentVariant = badgeVariants[variant] || badgeVariants.default;
  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[11px] gap-1.5"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border tracking-tight shadow-subtle ${currentVariant.container} ${sizeClasses} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${currentVariant.dot}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
