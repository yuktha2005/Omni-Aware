import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  loading?: boolean;
}

const StatsCard = ({
  title,
  value,
  icon,
  subtitle,
  loading = false,
}: StatsCardProps) => {
  if (loading) {
    return (
      <div className="shell-surface p-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="mt-5 h-8 w-20 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="shell-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
            {icon}
          </div>
        )}
      </div>
      {subtitle && <p className="mt-3 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};

export default StatsCard;
