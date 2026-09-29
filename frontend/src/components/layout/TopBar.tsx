import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { BellIcon, SearchIcon, LogoutIcon } from "../ui/Icons";

const TopBar = ({
  onMobileMenu,
  pageTitle,
}: {
  onMobileMenu?: () => void;
  pageTitle: string;
}) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { isInstallable, installApp } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    requestPermission,
    loading: pushLoading,
  } = usePushNotifications();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header
      className={`sticky top-0 z-20 flex h-16 sm:h-18 items-center justify-between border-b bg-white/85 px-4 sm:px-8 backdrop-blur-md transition-all duration-200 ${
        scrolled ? "border-slate-300/80 shadow-card bg-white/95" : "border-slate-200/80"
      }`}
    >
      {/* Left: Mobile trigger & Page Breadcrumb Info */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMobileMenu}
          className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-600">
              Cloud Console
            </span>
            <span className="text-slate-300">/</span>
            {/* Live Operational Status Chip */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100/80 px-2 py-0.5 border border-slate-200 text-[11px] font-medium text-slate-700">
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="hidden xs:inline text-[10px] font-semibold tracking-wide">
                {isOnline ? "Gateways Synchronized" : "Local Offline Cache"}
              </span>
            </div>
          </div>
          <h1 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 truncate max-w-[220px] sm:max-w-md">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Search, Push Alerts, Profile & Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search Bar with Keyboard Shortcut */}
        <div className="relative hidden md:block w-52 lg:w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns, recipients..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-9 pr-12 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all shadow-subtle"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 shadow-subtle">
            Ctrl+K
          </kbd>
        </div>

        {/* PWA Client Install */}
        {isInstallable && (
          <button
            onClick={() => installApp()}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 shadow-subtle transition-all hover:bg-brand-100 hover:border-brand-300"
            title="Install Desktop Client"
          >
            <svg className="h-3.5 w-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>App Client</span>
          </button>
        )}

        {/* Push Notification Toggle */}
        {pushSupported && !pushSubscribed && (
          <button
            onClick={() => requestPermission()}
            disabled={pushLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-subtle transition-all"
            title="Enable Live Alerts"
          >
            <BellIcon className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Alerts</span>
          </button>
        )}

        {/* Operator Profile Card */}
        {admin && (
          <div className="flex items-center gap-2.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 shadow-subtle hover:border-slate-300 transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 text-xs font-bold text-white shadow-sm ring-1 ring-brand-700/30">
              {admin.full_name?.[0] || admin.email?.[0] || "A"}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-xs font-bold text-slate-900 leading-tight line-clamp-1">
                {admin.full_name || admin.email}
              </p>
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                {admin.role === "admin"
                  ? "Gov Administrator"
                  : admin.role === "campaign_manager"
                  ? "Campaign Director"
                  : "Outreach Lead"}
              </p>
            </div>
          </div>
        )}

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-subtle transition-all"
          title="Sign Out"
        >
          <LogoutIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
