interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

const LoadingSkeleton = ({ rows = 5, className = "" }: LoadingSkeletonProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-5 animate-pulse rounded bg-slate-200"
          style={{ width: `${80 - (i % 3) * 10}%` }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
