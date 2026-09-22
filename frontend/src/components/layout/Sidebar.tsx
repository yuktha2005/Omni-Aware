import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import type { UserRole } from "../../types/auth";

interface NavItem {
  name: string;
  path: string;
  icon: string;
  roles?: UserRole[];
  comingSoon?: boolean;
}

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/dashboard", icon: "D" },
  { name: "Recipients", path: "/recipients", icon: "R" },
  { name: "Import Data", path: "/import", icon: "I", roles: ["admin"] },
  { name: "Audience Segments", path: "/audience", icon: "A", roles: ["admin", "campaign_manager"] },
  { name: "Master Data", path: "/master-data", icon: "M", roles: ["admin"] },
  { name: "Campaigns", path: "/campaigns", icon: "C", roles: ["admin", "campaign_manager"] },
  { name: "Campaign Wizard", path: "/campaigns/wizard", icon: "W", roles: ["admin", "campaign_manager"] },
  { name: "Templates", path: "/templates", icon: "T" },
  { name: "Scheduling", path: "/scheduling", icon: "S", roles: ["admin", "campaign_manager"] },
  { name: "Analytics", path: "/analytics", icon: "N", roles: ["admin", "campaign_manager"] },
  { name: "Team & RBAC", path: "/team", icon: "U", roles: ["admin"] },
  { name: "Content Library", path: "/content-library", icon: "L", comingSoon: true },
];

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const { isInstallable, installApp } = usePWAInstall();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (role === "admin") return true;
    return item.roles.includes(role);
  });

  return (
    <aside className="flex h-screen w-72 flex-col overflow-y-auto border-r border-slate-800 bg-slate-950 text-slate-200 shadow-[8px_0_30px_rgba(15,23,42,0.12)]">
      {/* Brand Header */}
      <div className="flex h-20 items-center border-b border-slate-800 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sm font-bold text-sky-400 ring-1 ring-sky-400/30">
            MCP
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400">
              Platform
            </p>
            <h1 className="text-base font-bold text-white tracking-tight">
              Awareness Engine
            </h1>
          </div>
        </div>
      </div>

      {/* Current User Role Pill */}
      {user && (
        <div className="px-4 pt-3 pb-1">
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Role</p>
            <p className="text-xs font-semibold text-sky-400 truncate mt-0.5">
              {role === "admin"
                ? "👑 Administrator"
                : role === "campaign_manager"
                ? "🎯 Campaign Manager"
                : "📢 Communication Team"}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-3">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30 font-semibold"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-200 ring-1 ring-slate-700/60 group-hover:bg-slate-700">
              {item.icon}
            </span>
            <span>{item.name}</span>
            {item.comingSoon && (
              <span className="ml-auto rounded-full border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                Soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / PWA Install & Logout */}
      <div className="border-t border-slate-800/80 p-3 space-y-2">
        {isInstallable && (
          <button
            onClick={() => installApp()}
            className="flex w-full items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-left text-xs font-semibold text-sky-300 transition-all hover:bg-sky-500/20"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </span>
            <span>Install App (PWA)</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 ring-1 ring-slate-700">
            ⏻
          </span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
