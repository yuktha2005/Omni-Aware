interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState = ({
  message = "An error occurred while loading data. Please try again.",
  onRetry,
}: ErrorStateProps) => {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-4 py-8 text-center">
      <svg
        className="h-10 w-10 text-red-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;
