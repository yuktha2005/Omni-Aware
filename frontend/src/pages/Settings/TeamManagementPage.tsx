import { useState, useEffect } from "react";
import { authAPI } from "../../services/apiService";
import { useAuth } from "../../contexts/AuthContext";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import type { Admin, UserRole, AuditLog } from "../../types/auth";
import { Link } from "react-router-dom";

const roleDisplayMap: Record<UserRole, { label: string; badgeClass: string; icon: string }> = {
  admin: {
    label: "Administrator",
    badgeClass: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "👑",
  },
  campaign_manager: {
    label: "Campaign Manager",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "🎯",
  },
  communication_team: {
    label: "Communication Team",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "📢",
  },
};

const actionDisplayMap: Record<string, { label: string; badgeClass: string; icon: string }> = {
  ROLE_CHANGED: {
    label: "Role Changed",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    icon: "🔄",
  },
  USER_STATUS_TOGGLED: {
    label: "Status Toggled",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "⚡",
  },
  CAMPAIGN_DISTRIBUTED: {
    label: "Broadcast Distributed",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: "🚀",
  },
  CAMPAIGN_SCHEDULED: {
    label: "Broadcast Scheduled",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "📅",
  },
  CAMPAIGN_CANCELLED: {
    label: "Broadcast Cancelled",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    icon: "🛑",
  },
  EMERGENCY_SOS_TRIGGERED: {
    label: "Emergency SOS Broadcast",
    badgeClass: "bg-red-100 text-red-800 border-red-300 animate-pulse",
    icon: "🚨",
  },
  USER_REGISTERED: {
    label: "User Registered",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    icon: "👤",
  },
};

const TeamManagementPage = () => {
  const { user, isAdmin, refreshUser } = useAuth();
  const { toast, showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"members" | "audit">("members");

  // Members State
  const [users, setUsers] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("all");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getUsers();
      setUsers(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load team members.";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const params = actionFilter !== "all" ? { action: actionFilter } : undefined;
      const res = await authAPI.getAuditLogs(params);
      setAuditLogs(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to load audit logs.";
      showToast("error", msg);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === "members") {
        fetchUsers();
      } else {
        fetchAuditLogs();
      }
    }
  }, [isAdmin, activeTab, actionFilter]);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      await authAPI.updateUserRole(userId, { role: newRole });
      showToast("success", "User role updated and logged to audit system.");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      if (user?.id === userId) {
        await refreshUser();
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update user role.";
      showToast("error", msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleStatusToggle = async (userId: number) => {
    setUpdatingUserId(userId);
    try {
      const res = await authAPI.toggleUserStatus(userId);
      showToast(
        "success",
        `User account ${res.data.is_active ? "activated" : "deactivated"} & logged.`
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: res.data.is_active } : u))
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to update account status.";
      showToast("error", msg);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization && u.organization.toLowerCase().includes(search.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === "all" || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-900">Access Restricted</h3>
        <p className="mt-1 text-sm text-red-700 max-w-md mx-auto">
          User governance and role-based permissions management is restricted to Administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>🛡️</span>
            <span>Team & Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full governance suite: manage team permissions, inspect immutable audit trails, and maintain compliance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Register New Member
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "members"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>👥</span>
          <span>Team Members & Roles</span>
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "audit"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <span>📜</span>
          <span>Security & System Audit Logs</span>
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
            {auditLogs.length}
          </span>
        </button>
      </div>

      {activeTab === "members" ? (
        <>
          {/* Role Summary Badges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">👑</span>
                <span className="text-xs font-bold text-purple-900">Administrators</span>
              </div>
              <p className="mt-1 text-[11px] text-purple-700">
                {users.filter((u) => u.role === "admin" && u.is_active).length} Active Accounts
              </p>
              <p className="mt-2 text-[10px] text-purple-600/80">Full governance, master data, imports, logs & settings</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-xs font-bold text-blue-900">Campaign Managers</span>
              </div>
              <p className="mt-1 text-[11px] text-blue-700">
                {users.filter((u) => u.role === "campaign_manager" && u.is_active).length} Active Accounts
              </p>
              <p className="mt-2 text-[10px] text-blue-600/80">Audience segmentation, wizard, scheduling, distribution & analytics</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">📢</span>
                <span className="text-xs font-bold text-emerald-900">Communication Teams</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700">
                {users.filter((u) => u.role === "communication_team" && u.is_active).length} Active Accounts
              </p>
              <p className="mt-2 text-[10px] text-emerald-600/80">6-language AI generation, translation, review & feedback</p>
            </div>
          </div>

          {/* Filter / Search Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="field-input pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Filter Role:</label>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="campaign_manager">Campaign Managers</option>
                <option value="communication_team">Communication Teams</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Member Details</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Current Role & Permissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3 text-right">Role Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Loading team directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No team members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleConfig = roleDisplayMap[u.role as UserRole] || roleDisplayMap.communication_team;
                      const isCurrentLoggedUser = user?.id === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700">
                                {u.full_name?.[0] || u.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  {u.full_name || "Unnamed"}
                                  {isCurrentLoggedUser && (
                                    <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[9px] font-bold text-sky-700 uppercase">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600">
                            {u.organization || <span className="text-slate-400 italic">General</span>}
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${roleConfig.badgeClass}`}
                            >
                              <span>{roleConfig.icon}</span>
                              <span>{roleConfig.label}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => handleStatusToggle(u.id)}
                              disabled={updatingUserId === u.id || isCurrentLoggedUser}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                u.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                              } disabled:opacity-50`}
                              title={isCurrentLoggedUser ? "Cannot deactivate yourself" : "Click to toggle status"}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                              {u.is_active ? "Active" : "Inactive"}
                            </button>
                          </td>

                          <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleString()
                              : "Never"}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              disabled={updatingUserId === u.id || isCurrentLoggedUser}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 disabled:opacity-50"
                            >
                              <option value="admin">👑 Administrator</option>
                              <option value="campaign_manager">🎯 Campaign Manager</option>
                              <option value="communication_team">📢 Communication Team</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Logs Tab */
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Filter Event Action:</label>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Security Events</option>
                <option value="ROLE_CHANGED">Role Changes</option>
                <option value="USER_STATUS_TOGGLED">Account Status Toggles</option>
                <option value="CAMPAIGN_DISTRIBUTED">Campaign Broadcasts</option>
                <option value="CAMPAIGN_SCHEDULED">Campaign Schedules</option>
                <option value="EMERGENCY_SOS_TRIGGERED">Emergency SOS Triggers</option>
                <option value="USER_REGISTERED">User Registrations</option>
              </select>
            </div>

            <button
              onClick={fetchAuditLogs}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Log Feed
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-4 py-3">Security Action</th>
                    <th className="px-4 py-3">Actor (Admin / Operator)</th>
                    <th className="px-4 py-3">Target Resource</th>
                    <th className="px-4 py-3 text-right">Details & Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Loading immutable audit logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No audit logs recorded for this filter.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const actionInfo = actionDisplayMap[log.action] || {
                        label: log.action,
                        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
                        icon: "📌",
                      };

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                            {new Date(log.created_at).toLocaleString()}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${actionInfo.badgeClass}`}
                            >
                              <span>{actionInfo.icon}</span>
                              <span>{actionInfo.label}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold text-slate-800">{log.actor_email || "System/Anonymous"}</p>
                              <span className="text-[10px] text-slate-400 uppercase font-mono">
                                {log.actor_role || "N/A"} • IP: {log.ip_address || "127.0.0.1"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                            {log.target_resource_type ? (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700 font-medium">
                                {log.target_resource_type} #{log.target_resource_id || "N/A"}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">General</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <span>View Payload</span>
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payload Modal */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
              <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Audit Log Event #{selectedLog.id}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Action</span>
                      <span className="font-semibold text-slate-800">{selectedLog.action}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Actor Email</span>
                      <span className="font-semibold text-slate-800">{selectedLog.actor_email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Actor Role</span>
                      <span className="font-semibold text-slate-800 uppercase">{selectedLog.actor_role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                      <span className="font-mono text-slate-800">{new Date(selectedLog.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Raw Payload Details</span>
                    <pre className="max-h-60 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 leading-relaxed">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

export default TeamManagementPage;
