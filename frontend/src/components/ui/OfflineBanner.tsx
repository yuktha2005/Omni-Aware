import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-md transition-all">
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 animate-pulse text-slate-950"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-6.364 9 9 0 012.828-6.364m2.829 2.829a5 5 0 012.828 4.243M3 3l18 18"
          />
        </svg>
        <span>
          You are currently <strong>Offline</strong>. Viewing cached application shell. Live syncing and campaign dispatch are paused.
        </span>
      </div>
      <span className="rounded bg-amber-600/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
        Offline Mode
      </span>
    </div>
  );
}
