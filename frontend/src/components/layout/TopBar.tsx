import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { usePushNotifications } from "../../hooks/usePushNotifications";

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
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, requestPermission, loading: pushLoading } = usePushNotifications();

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
      className={`sticky top-0 z-20 flex h-16 sm:h-20 items-center justify-between border-b bg-white/90 px-3 sm:px-6 backdrop-blur-md transition-all duration-200 ${
        scrolled ? "border-slate-200 shadow-sm" : "border-slate-200/80"
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMobileMenu}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Toggle menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Workspace
            </p>
            {/* Online / Offline status badge */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[10px] font-medium ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-md">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button in TopBar */}
        {isInstallable && (
          <button
            onClick={() => installApp()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition-all hover:bg-sky-100 active:scale-95"
            title="Install as Progressive Web App"
          >
            <svg
              className="h-4 w-4 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span className="hidden sm:inline">Install PWA</span>
          </button>
        )}

        {/* Push Notification Toggle */}
        {pushSupported && !pushSubscribed && (
          <button
            onClick={() => requestPermission()}
            disabled={pushLoading}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Enable Push Notifications"
          >
            <svg className="h-3.5 w-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Enable Alerts</span>
          </button>
        )}

        {admin && (
          <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
              {admin.full_name?.[0] || admin.email?.[0] || "?"}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                {admin.full_name || admin.email}
              </p>
              <p className="text-[10px] font-medium text-sky-700">
                {admin.role === "admin"
                  ? "👑 Administrator"
                  : admin.role === "campaign_manager"
                  ? "🎯 Campaign Manager"
                  : "📢 Communication Team"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 11-4 0v-1m4-11V7a4 4 0 00-4-4H5a2 2 0 00-2 2v9a2 2 0 002 2h7m-4 0"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
