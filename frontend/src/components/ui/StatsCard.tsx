import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
  accentColor?: "indigo" | "emerald" | "cyan" | "amber" | "violet" | "rose" | "slate";
  className?: string;
}

const accentBarClasses = {
  indigo: "from-brand-500 to-indigo-600",
  emerald: "from-emerald-400 to-teal-500",
  cyan: "from-cyan-400 to-blue-500",
  amber: "from-amber-400 to-orange-500",
  violet: "from-purple-500 to-indigo-600",
  rose: "from-rose-400 to-pink-500",
  slate: "from-slate-400 to-slate-600",
};

const StatsCard = ({
  title,
  value,
  icon,
  subtitle,
  trend,
  trendUp = true,
  loading = false,
  accentColor = "indigo",
  className = "",
}: StatsCardProps) => {
  if (loading) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-card ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
        <div className="mt-4 h-9 w-24 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft hover:border-slate-300 ${className}`}
    >
      {/* Top Accent Micro-Bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
          accentBarClasses[accentColor] || accentBarClasses.indigo
        } opacity-80 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-200 shadow-subtle transition-all group-hover:scale-105 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-200">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <div className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
          {value}
        </div>
        {trend && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
              trendUp
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                : "bg-rose-50 text-rose-700 border border-rose-200/60"
            }`}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs font-normal text-slate-500 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
};

export default StatsCard;
