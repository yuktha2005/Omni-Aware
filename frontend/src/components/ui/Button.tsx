import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "brand";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  icon?: ReactNode;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none active:scale-[0.99]";

const buttonVariants: Record<string, string> = {
  primary:
    "bg-gradient-to-b from-brand-600 via-brand-600 to-brand-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_4px_rgba(79,70,229,0.25)] ring-1 ring-brand-700/60 hover:from-brand-500 hover:to-brand-700 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_16px_rgba(79,70,229,0.35)] focus:ring-brand-500",
  brand:
    "bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(79,70,229,0.3)] hover:brightness-110 focus:ring-brand-500",
  secondary:
    "bg-white border border-slate-300 text-slate-700 shadow-subtle hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 focus:ring-slate-400",
  outline:
    "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-400 focus:ring-slate-400",
  danger:
    "bg-gradient-to-b from-rose-600 to-rose-700 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_4px_rgba(225,29,72,0.25)] ring-1 ring-rose-700/60 hover:from-rose-500 hover:to-rose-700 focus:ring-rose-500",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-300",
};

const buttonSizes: Record<string, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  className = "",
  icon,
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${buttonBase} ${buttonVariants[variant] || buttonVariants.primary} ${buttonSizes[size]} ${className}`}
    >
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
