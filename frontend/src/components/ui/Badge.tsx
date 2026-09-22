import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

const badgeClasses = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

const Badge = ({
  children,
  variant = "default",
  size = "md",
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${
        badgeClasses[variant]
      } ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"}`}
    >
      {children}
    </span>
  );
};

export default Badge;
