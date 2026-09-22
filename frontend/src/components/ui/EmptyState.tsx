import { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

const EmptyState = ({
  title = "No data found",
  description = "There are no records to display at this time.",
  action,
  icon,
}: EmptyStateProps) => {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <div>
        <h3 className="text-lg font-medium text-slate-700">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
