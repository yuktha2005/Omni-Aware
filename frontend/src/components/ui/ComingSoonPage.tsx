const ComingSoonPage = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="rounded-full bg-slate-100 p-6">
        <svg
          className="h-12 w-12 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
        <p className="mt-2 text-slate-500">{description}</p>
      </div>
      <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
        Coming Soon
      </span>
    </div>
  );
};

export default ComingSoonPage;
