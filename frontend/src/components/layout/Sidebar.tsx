import { FC } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import type { UserRole } from "../../types/auth";
import {
  DashboardIcon,
  UsersIcon,
  ImportIcon,
  AudienceIcon,
  DatabaseIcon,
  CampaignIcon,
  WizardIcon,
  TemplateIcon,
  ScheduleIcon,
  AnalyticsIcon,
  TeamIcon,
  ContentLibraryIcon,
  LogoutIcon,
  RadioIcon,
  CheckCircleIcon,
} from "../ui/Icons";

interface NavItem {
  name: string;
  path: string;
  icon: FC<{ className?: string }>;
  roles?: UserRole[];
  comingSoon?: boolean;
  badge?: string;
  badgeColor?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", path: "/dashboard", icon: DashboardIcon },
      { name: "System Flow", path: "/system-flow", icon: RadioIcon },
    ],
  },
  {
    title: "Campaigns",
    items: [
      { name: "Campaigns", path: "/campaigns", icon: CampaignIcon },
      {
        name: "Approvals",
        path: "/approvals",
        icon: CheckCircleIcon,
        roles: ["admin", "campaign_manager"],
        badge: "Review",
        badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      },
      { name: "AI Wizard", path: "/campaigns/wizard", icon: WizardIcon, badge: "AI", badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
      { name: "Templates", path: "/templates", icon: TemplateIcon },
      { name: "Scheduling", path: "/scheduling", icon: ScheduleIcon, roles: ["admin", "campaign_manager"] },
      { name: "Content Library", path: "/content-library", icon: ContentLibraryIcon },
    ],
  },

  {
    title: "Audience",
    items: [
      { name: "Recipients", path: "/recipients", icon: UsersIcon },
      { name: "Import", path: "/import", icon: ImportIcon, roles: ["admin", "communication_team"], badge: "CSV", badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
      { name: "Segments", path: "/audience", icon: AudienceIcon, roles: ["admin", "campaign_manager"] },
      { name: "Master Data", path: "/master-data", icon: DatabaseIcon, roles: ["admin"] },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Analytics", path: "/analytics", icon: AnalyticsIcon, badge: "Live", badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
      { name: "Team & Access", path: "/team", icon: TeamIcon, roles: ["admin"] },
    ],
  },
];

const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const { isInstallable, installApp } = usePWAInstall();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isItemVisible = (item: NavItem) => {
    if (!item.roles) return true;
    if (role === "admin") return true;
    return item.roles.includes(role);
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-800/80 bg-[#080d19] text-slate-200 shadow-2xl selection:bg-indigo-600">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4 bg-gradient-to-b from-[#0f172a]/80 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 text-white shadow-md shadow-indigo-900/40">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#080d19]">
              <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
              OmniAware <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">AI</span>
            </h1>
          </div>
        </div>
      </div>

      {/* Operator Status Pill */}
      {user && (
        <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0c1427]/80 px-2.5 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <div className="truncate">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {role === "admin"
                    ? "Admin"
                    : role === "campaign_manager"
                      ? "Campaign Manager"
                      : "Communication Team"}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
              Online
            </span>
          </div>
        </div>
      )}

      {/* Navigation Links with Categorized Sections */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 text-xs">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                {section.title}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${isActive
                        ? "bg-gradient-to-r from-brand-600/25 via-indigo-600/15 to-transparent text-white font-semibold border-l-[3px] border-brand-500 shadow-sm"
                        : "text-slate-400 hover:bg-slate-900/70 hover:text-slate-100"
                      }`
                    }
                  >
                    <span className="flex h-5 w-5 items-center justify-center text-slate-400 transition-colors group-hover:text-brand-400">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`ml-auto rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${item.badgeColor || "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Telemetry & Footer Actions */}
      <div className="border-t border-slate-800/80 bg-[#060a14] p-2.5 space-y-2">
        <div className="flex items-center justify-between rounded-md border border-slate-800/80 bg-slate-900/40 px-2.5 py-1.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-medium text-slate-300">PROD-IN1</span>
          </div>
          <span className="font-semibold text-emerald-400">99.98% SLA</span>
        </div>

        {isInstallable && (
          <button
            onClick={() => installApp()}
            className="flex w-full items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/10 px-2.5 py-1.5 text-left text-xs font-semibold text-brand-300 transition-all hover:bg-brand-500/20 hover:text-white"
          >
            <svg className="h-3.5 w-3.5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Install App</span>
          </button>
        )}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-400 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogoutIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
