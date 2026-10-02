import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AccessDeniedPage = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 shadow-inner border border-rose-100">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m0 0v2m0-2h2m-2 0H10m7.5-6.5A5.5 5.5 0 0012 5a5.5 5.5 0 00-5.5 5.5c0 1.61.69 3.06 1.79 4.07.13.12.21.28.21.46V17a2 2 0 002 2h3a2 2 0 002-2v-1.97c0-.18.08-.34.21-.46A5.467 5.467 0 0017.5 10.5z" />
          </svg>
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-sm shadow-md">
          🛑
        </span>
      </div>

      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700">
        HTTP 403 • Forbidden Access
      </span>

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Permission Denied
      </h1>

      <p className="mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
        Your current role (<strong className="text-slate-900 uppercase font-mono">{user?.role || "GUEST"}</strong>) does not have authorization to view or execute operations on this module.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left max-w-md w-full">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Access Requirements</h4>
        <ul className="mt-2 space-y-1 text-xs text-slate-500">
          <li className="flex items-center gap-1.5">
            <span className="text-purple-600 font-bold">👑 Admin:</span> Full governance, user control, master data & audit logs.
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-blue-600 font-bold">🎯 Campaign Manager:</span> Segmentation, campaign wizard, dispatch & analytics.
          </li>
          <li className="flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">📢 Communication Team:</span> Recipient imports, AI drafts & translations.
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Return to Dashboard
        </Link>
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          View Campaigns
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
