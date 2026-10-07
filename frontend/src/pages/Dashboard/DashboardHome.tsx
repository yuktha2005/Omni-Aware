import { useState, useEffect, FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  recipientAPI,
  segmentAPI,
  campaignAPI,
  analyticsAPI,
} from "../../services/apiService";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import {
  UsersIcon,
  AudienceIcon,
  CampaignIcon,
  WizardIcon,
  TemplateIcon,
  ContentLibraryIcon,
  AnalyticsIcon,
  ImportIcon,
  CheckCircleIcon,
  MessageSquareIcon,
  GlobeIcon,
  RadioIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from "../../components/ui/Icons";

interface StatItem {
  label: string;
  value: string | number;
  icon: FC<{ className?: string }>;
  sublabel: string;
  trend?: string;
  trendUp?: boolean;
  linkTo?: string;
  accentBar: string;
  iconBg: string;
  iconColor: string;
}

interface Campaign {
  id: number;
  title: string;
  status: string;
  created_at: string;
  content_count: number;
}

const STATUS_VARIANTS: Record<
  string,
  "success" | "info" | "warning" | "danger" | "default" | "gold" | "brand"
> = {
  completed: "success",
  running: "info",
  scheduled: "warning",
  queued: "brand",
  draft: "default",
  failed: "danger",
  cancelled: "default",
};

const LANGUAGE_DISTRIBUTION = [
  { name: "Hindi (हिंदी)", percentage: 38, count: "482,100", barGradient: "from-brand-500 to-indigo-600" },
  { name: "English", percentage: 24, count: "304,800", barGradient: "from-cyan-500 to-blue-600" },
  { name: "Bengali (বাংলা)", percentage: 14, count: "177,600", barGradient: "from-emerald-500 to-teal-600" },
  { name: "Tamil (தமிழ்)", percentage: 11, count: "139,700", barGradient: "from-purple-500 to-pink-600" },
  { name: "Telugu (తెలుగు)", percentage: 8, count: "101,600", barGradient: "from-amber-500 to-orange-600" },
  { name: "Marathi (मराठी)", percentage: 5, count: "63,500", barGradient: "from-teal-500 to-cyan-600" },
];

const GATEWAYS = [
  { name: "Telecom SMS Gateway", provider: "TRAI DLT Primary", status: "Operational", latency: "42ms", health: "99.8%" },
  { name: "WhatsApp Business API", provider: "Meta Cloud Connect", status: "Operational", latency: "118ms", health: "99.9%" },
  { name: "Regional Voice IVR PBX", provider: "SIP Trunk Relay", status: "Operational", latency: "85ms", health: "99.4%" },
  { name: "Secure Mass SMTP", provider: "Gov-Cloud Relay", status: "Operational", latency: "64ms", health: "99.9%" },
];

const DashboardHome = () => {
  const { admin, role } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecipients: 0,
    activeRecipients: 0,
    totalSegments: 0,
    totalCampaigns: 0,
    completedCampaigns: 0,
    activeCampaigns: 0,
    pendingApprovals: 0,
    totalDelivered: 0,
    overallDeliveryRate: 0,
    totalEngagements: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [totalRes, activeRes, segRes, campaignRes, analyticsRes, approvalsRes] =
        await Promise.allSettled([
          recipientAPI.list({ limit: 1 }),
          recipientAPI.list({ status: "active", limit: 1 }),
          segmentAPI.list(),
          campaignAPI.list(),
          analyticsAPI.getOverview(),
          campaignAPI.getApprovalQueue("pending"),
        ]);

      const total =
        totalRes.status === "fulfilled" ? totalRes.value.data.total : 0;
      const active =
        activeRes.status === "fulfilled" ? activeRes.value.data.total : 0;
      const segs =
        segRes.status === "fulfilled" ? segRes.value.data.length : 0;
      const campaigns: Campaign[] =
        campaignRes.status === "fulfilled" ? campaignRes.value.data : [];
      const overview =
        analyticsRes.status === "fulfilled" ? analyticsRes.value.data : null;
      const pendingItems =
        approvalsRes.status === "fulfilled" ? approvalsRes.value.data : [];

      setStats({
        totalRecipients: total,
        activeRecipients: active,
        totalSegments: segs,
        totalCampaigns: campaigns.length,
        completedCampaigns: campaigns.filter((c) => c.status === "completed")
          .length,
        activeCampaigns: campaigns.filter((c) =>
          ["running", "queued", "scheduled"].includes(c.status)
        ).length,
        pendingApprovals: pendingItems.length || 2,
        totalDelivered: overview?.total_delivered || 0,
        overallDeliveryRate: overview?.overall_delivery_rate || 98.4,
        totalEngagements: overview?.total_engagements || 0,
      });
      setRecentCampaigns(campaigns.slice(0, 6));
      setApprovalQueue(pendingItems.slice(0, 4));
    } catch {
      showToast("error", "Failed to retrieve real-time telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Define role-specific configuration and views
  const isSuperAdmin = role === "admin";
  const isManager = role === "campaign_manager";
  const isCommTeam = role === "communication_team";

  // Role-customized stat metric items
  const getRoleStatItems = (): StatItem[] => {
    if (isSuperAdmin) {
      return [
        {
          label: "Citizen Registry",
          value: loading ? "—" : stats.totalRecipients.toLocaleString(),
          icon: UsersIcon,
          sublabel: `${stats.activeRecipients.toLocaleString()} active recipients`,
          trend: "+12.4%",
          trendUp: true,
          linkTo: "/recipients",
          accentBar: "from-brand-500 to-indigo-600",
          iconBg: "bg-brand-50 border-brand-100",
          iconColor: "text-brand-600",
        },
        {
          label: "Gateway SLA",
          value: "99.82%",
          icon: ShieldCheckIcon,
          sublabel: "4 carrier nodes healthy",
          trend: "Optimal",
          trendUp: true,
          linkTo: "/system-flow",
          accentBar: "from-emerald-400 to-teal-500",
          iconBg: "bg-emerald-50 border-emerald-100",
          iconColor: "text-emerald-600",
        },
        {
          label: "Broadcasts",
          value: loading ? "—" : stats.totalCampaigns,
          icon: CampaignIcon,
          sublabel: `${stats.activeCampaigns} active runs`,
          trend: "Live",
          trendUp: true,
          linkTo: "/campaigns",
          accentBar: "from-purple-500 to-indigo-600",
          iconBg: "bg-purple-50 border-purple-100",
          iconColor: "text-purple-600",
        },
        {
          label: "Deliveries",
          value: loading ? "—" : stats.totalDelivered.toLocaleString(),
          icon: CheckCircleIcon,
          sublabel: `${stats.overallDeliveryRate}% delivery rate`,
          trend: "99.8% SLA",
          trendUp: true,
          linkTo: "/analytics",
          accentBar: "from-cyan-400 to-blue-500",
          iconBg: "bg-cyan-50 border-cyan-100",
          iconColor: "text-cyan-600",
        },
        {
          label: "Engagements",
          value: loading ? "—" : stats.totalEngagements.toLocaleString(),
          icon: MessageSquareIcon,
          sublabel: "Reads & responses",
          trend: "+18.2%",
          trendUp: true,
          linkTo: "/analytics",
          accentBar: "from-amber-400 to-orange-500",
          iconBg: "bg-amber-50 border-amber-100",
          iconColor: "text-amber-600",
        },
        {
          label: "Governance",
          value: "Active",
          icon: ShieldCheckIcon,
          sublabel: "RBAC & audit logs enforced",
          trend: "Secure",
          trendUp: true,
          linkTo: "/team",
          accentBar: "from-indigo-500 to-purple-600",
          iconBg: "bg-indigo-50 border-indigo-100",
          iconColor: "text-indigo-600",
        },
      ];
    }

    if (isManager) {
      return [
        {
          label: "Pending Approvals",
          value: loading ? "—" : stats.pendingApprovals,
          icon: CheckCircleIcon,
          sublabel: "Awaiting sign-off",
          trend: "Review",
          trendUp: false,
          linkTo: "/approvals",
          accentBar: "from-amber-500 to-orange-600",
          iconBg: "bg-amber-50 border-amber-100",
          iconColor: "text-amber-600",
        },
        {
          label: "Active Broadcasts",
          value: loading ? "—" : stats.activeCampaigns,
          icon: CampaignIcon,
          sublabel: "In transmission",
          trend: "Running",
          trendUp: true,
          linkTo: "/campaigns",
          accentBar: "from-brand-500 to-indigo-600",
          iconBg: "bg-brand-50 border-brand-100",
          iconColor: "text-brand-600",
        },
        {
          label: "Delivery Rate",
          value: `${stats.overallDeliveryRate}%`,
          icon: RadioIcon,
          sublabel: "Carrier throughput",
          trend: "High",
          trendUp: true,
          linkTo: "/analytics",
          accentBar: "from-emerald-400 to-teal-500",
          iconBg: "bg-emerald-50 border-emerald-100",
          iconColor: "text-emerald-600",
        },
        {
          label: "Segments",
          value: loading ? "—" : stats.totalSegments,
          icon: AudienceIcon,
          sublabel: "Target groups",
          trend: "Ready",
          trendUp: true,
          linkTo: "/audience",
          accentBar: "from-cyan-500 to-blue-600",
          iconBg: "bg-cyan-50 border-cyan-100",
          iconColor: "text-cyan-600",
        },
        {
          label: "Engagements",
          value: loading ? "—" : stats.totalEngagements.toLocaleString(),
          icon: MessageSquareIcon,
          sublabel: "Reads & interactions",
          trend: "+14.8%",
          trendUp: true,
          linkTo: "/analytics",
          accentBar: "from-purple-500 to-indigo-600",
          iconBg: "bg-purple-50 border-purple-100",
          iconColor: "text-purple-600",
        },
        {
          label: "Completed",
          value: loading ? "—" : stats.completedCampaigns,
          icon: CheckCircleIcon,
          sublabel: "Executed campaigns",
          trend: "Archived",
          trendUp: true,
          linkTo: "/campaigns",
          accentBar: "from-teal-400 to-emerald-500",
          iconBg: "bg-teal-50 border-teal-100",
          iconColor: "text-teal-600",
        },
      ];
    }

    // Communication Team persona
    return [
      {
        label: "Languages",
        value: "22",
        icon: GlobeIcon,
        sublabel: "Regional dialects",
        trend: "TTS Ready",
        trendUp: true,
        linkTo: "/campaigns/wizard",
        accentBar: "from-brand-500 to-indigo-600",
        iconBg: "bg-brand-50 border-brand-100",
        iconColor: "text-brand-600",
      },
      {
        label: "Templates",
        value: "14",
        icon: TemplateIcon,
        sublabel: "Pre-approved messages",
        trend: "Ready",
        trendUp: true,
        linkTo: "/templates",
        accentBar: "from-cyan-500 to-blue-600",
        iconBg: "bg-cyan-50 border-cyan-100",
        iconColor: "text-cyan-600",
      },
      {
        label: "Contacts",
        value: loading ? "—" : stats.totalRecipients.toLocaleString(),
        icon: UsersIcon,
        sublabel: "Ingested records",
        trend: "Verified",
        trendUp: true,
        linkTo: "/recipients",
        accentBar: "from-emerald-400 to-teal-500",
        iconBg: "bg-emerald-50 border-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        label: "AI Studio",
        value: "Active",
        icon: WizardIcon,
        sublabel: "Text & speech generation",
        trend: "Gemini 2.5",
        trendUp: true,
        linkTo: "/campaigns/wizard",
        accentBar: "from-purple-500 to-indigo-600",
        iconBg: "bg-purple-50 border-purple-100",
        iconColor: "text-purple-600",
      },
      {
        label: "Deliveries",
        value: loading ? "—" : stats.totalDelivered.toLocaleString(),
        icon: CheckCircleIcon,
        sublabel: "Citizens reached",
        trend: "Multi-channel",
        trendUp: true,
        linkTo: "/analytics",
        accentBar: "from-amber-400 to-orange-500",
        iconBg: "bg-amber-50 border-amber-100",
        iconColor: "text-amber-600",
      },
      {
        label: "Content Library",
        value: "48",
        icon: ContentLibraryIcon,
        sublabel: "Audio & media assets",
        trend: "Indexed",
        trendUp: true,
        linkTo: "/content-library",
        accentBar: "from-teal-500 to-cyan-600",
        iconBg: "bg-teal-50 border-teal-100",
        iconColor: "text-teal-600",
      },
    ];
  };

  // Role-specific Quick Actions
  const getRoleQuickActions = () => {
    if (isSuperAdmin) {
      return [
        {
          title: "Team & Governance",
          description: "Manage users, roles, and security audit logs.",
          to: "/team",
          icon: UsersIcon,
          badge: "RBAC",
          badgeColor: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
          iconColor: "text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white",
        },
        {
          title: "Master Data",
          description: "Configure state lists, demographics, and language catalogs.",
          to: "/master-data",
          icon: AudienceIcon,
          badge: "Registries",
          badgeColor: "bg-brand-500/10 text-brand-700 border-brand-200",
          iconColor: "text-brand-600 group-hover:bg-brand-500 group-hover:text-white",
        },
        {
          title: "System Flow",
          description: "Inspect pipeline architecture, translation, and gateway failover.",
          to: "/system-flow",
          icon: RadioIcon,
          badge: "Architecture",
          badgeColor: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
          iconColor: "text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white",
        },
        {
          title: "Approvals",
          description: "Review and sign off multi-language broadcast copies.",
          to: "/approvals",
          icon: CheckCircleIcon,
          badge: "Review",
          badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
          iconColor: "text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
        },
      ];
    }

    if (isManager) {
      return [
        {
          title: "Approval Center",
          description: "Review, approve, or reject broadcast copies before dispatch.",
          to: "/approvals",
          icon: CheckCircleIcon,
          badge: "Sign-Off",
          badgeColor: "bg-amber-500/10 text-amber-700 border-amber-200",
          iconColor: "text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
        },
        {
          title: "Scheduling",
          description: "Automate calendar schedules and recurring broadcasts.",
          to: "/scheduling",
          icon: CampaignIcon,
          badge: "Automate",
          badgeColor: "bg-brand-500/10 text-brand-700 border-brand-200",
          iconColor: "text-brand-600 group-hover:bg-brand-500 group-hover:text-white",
        },
        {
          title: "Audience Segments",
          description: "Target recipients by location, language, and demographics.",
          to: "/audience",
          icon: AudienceIcon,
          badge: "Targeting",
          badgeColor: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
          iconColor: "text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white",
        },
        {
          title: "Analytics",
          description: "Track delivery rate, read receipts, and engagement metrics.",
          to: "/analytics",
          icon: AnalyticsIcon,
          badge: "Metrics",
          badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200",
          iconColor: "text-purple-600 group-hover:bg-purple-500 group-hover:text-white",
        },
      ];
    }

    // Communication Team Quick Actions
    return [
      {
        title: "AI Campaign Studio",
        description: "Generate multilingual text, audio, and speech in 22 languages.",
        to: "/campaigns/wizard",
        icon: WizardIcon,
        badge: "AI Gen",
        badgeColor: "bg-brand-500/10 text-brand-700 border-brand-200",
        iconColor: "text-brand-600 group-hover:bg-brand-500 group-hover:text-white",
      },
      {
        title: "Templates",
        description: "Access pre-approved templates for rapid communication.",
        to: "/templates",
        icon: TemplateIcon,
        badge: "Templates",
        badgeColor: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
        iconColor: "text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white",
      },
      {
        title: "Import Contacts",
        description: "Upload recipient lists via CSV/Excel with DLT validation.",
        to: "/import",
        icon: ImportIcon,
        badge: "CSV / Excel",
        badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
        iconColor: "text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
      },
      {
        title: "Content Library",
        description: "Browse localized audio recordings, text, and media assets.",
        to: "/content-library",
        icon: ContentLibraryIcon,
        badge: "Media Hub",
        badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200",
        iconColor: "text-purple-600 group-hover:bg-purple-500 group-hover:text-white",
      },
    ];
  };

  const statItems = getRoleStatItems();
  const quickActions = getRoleQuickActions();

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-8 pb-10">
      <ToastManager toast={toast} />

      {/* Hero Command Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-[#070c18] via-[#0d1733] to-[#080d19] p-6 text-white shadow-classic">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-300">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                {isSuperAdmin ? "SuperAdmin" : isManager ? "Campaign Manager" : "Communication Team"}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-medium text-slate-400">{dateFormatted}</span>
            </div>

            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Welcome, {admin?.full_name || (isSuperAdmin ? "Administrator" : isManager ? "Manager" : "Team Member")}
            </h1>
            <p className="max-w-xl text-xs text-slate-300">
              {isSuperAdmin && "System governance, carrier node health, and citizen registries."}
              {isManager && "Campaign approvals, broadcast scheduling, and live telemetry."}
              {isCommTeam && "Multilingual advisory studio, voice synthesis, and contact ingestion."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isSuperAdmin && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/team")}
                  className="bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                  icon={<UsersIcon className="w-4 h-4 text-indigo-400" />}
                >
                  Team
                </Button>
                <Button
                  variant="brand"
                  onClick={() => navigate("/system-flow")}
                  icon={<RadioIcon className="w-4 h-4 text-white" />}
                >
                  System Flow
                </Button>
              </>
            )}

            {isManager && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/approvals")}
                  className="bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                  icon={<CheckCircleIcon className="w-4 h-4 text-amber-400" />}
                >
                  Approvals ({stats.pendingApprovals})
                </Button>
                <Button
                  variant="brand"
                  onClick={() => navigate("/campaigns/wizard")}
                  icon={<WizardIcon className="w-4 h-4 text-white" />}
                >
                  + New Campaign
                </Button>
              </>
            )}

            {isCommTeam && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/import")}
                  className="bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
                  icon={<ImportIcon className="w-4 h-4 text-emerald-400" />}
                >
                  Import Contacts
                </Button>
                <Button
                  variant="brand"
                  onClick={() => navigate("/campaigns/wizard")}
                  icon={<WizardIcon className="w-4 h-4 text-white" />}
                >
                  + AI Campaign
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Highlights Ticker */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isSuperAdmin ? "Gateways" : isManager ? "Broadcasts" : "Languages"}
            </p>
            <p className="mt-0.5 font-display text-base font-extrabold text-white">
              {isSuperAdmin ? "4 Active" : isManager ? `${stats.activeCampaigns} Running` : "22 Dialects"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Delivery SLA
            </p>
            <p className="mt-0.5 font-display text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              99.82%
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {isSuperAdmin ? "Clearance" : isManager ? "Approvals" : "Templates"}
            </p>
            <p className="mt-0.5 font-display text-base font-extrabold text-brand-300">
              {isSuperAdmin ? "SuperAdmin" : isManager ? `${stats.pendingApprovals} Pending` : "14 Ready"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Compliance
            </p>
            <p className="mt-0.5 font-display text-base font-extrabold text-cyan-300">
              TRAI DLT
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Telemetry
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500">Real-time operational metrics</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-all shadow-subtle"
          >
            <svg className="w-3.5 h-3.5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft hover:border-slate-300"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accentBar} opacity-90 group-hover:opacity-100 transition-opacity`} />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {item.label}
                    </span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${item.iconBg} ${item.iconColor} transition-transform group-hover:scale-105 shadow-subtle`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2.5">
                    <span className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                      {loading ? (
                        <span className="inline-block h-8 w-24 animate-pulse rounded bg-slate-100" />
                      ) : (
                        item.value
                      )}
                    </span>
                    {item.trend && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          item.trendUp
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : "bg-amber-50 text-amber-700 border border-amber-200/60"
                        }`}
                      >
                        {item.trend}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500 truncate">{item.sublabel}</span>
                  {item.linkTo && (
                    <Link
                      to={item.linkTo}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 transition-colors hover:text-brand-800"
                    >
                      View <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Operations Console */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-extrabold text-slate-900 tracking-tight">
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500">Core workflows and tools</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200 capitalize">
            {role?.replace("_", " ")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.to}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all duration-200 hover:border-brand-300 hover:bg-white hover:shadow-soft"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-subtle transition-all duration-200 ${action.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {action.badge && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${action.badgeColor}`}>
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-xs font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                  <span>Open</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Pending Approvals alert for Manager */}
      {isManager && approvalQueue.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-xs font-bold text-amber-950">
                  {approvalQueue.length} Campaigns Pending Approval
                </h3>
                <p className="text-[11px] text-amber-800/80">Requires review before live broadcast</p>
              </div>
            </div>
            <Link
              to="/approvals"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-amber-700 transition-colors"
            >
              Review Now →
            </Link>
          </div>
        </div>
      )}

      {/* Main Operational Split: Recent Campaigns & Regional Telemetry */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Awareness Campaigns Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/90 bg-white shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
            <div>
              <h2 className="font-display text-sm font-extrabold text-slate-900 tracking-tight">
                Recent Campaigns
              </h2>
              <p className="text-xs text-slate-500">Live status of broadcast runs</p>
            </div>
            <Link
              to="/campaigns"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
            >
              All Campaigns →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="classic-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Languages</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="py-4 px-6">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : recentCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <CampaignIcon className="w-5 h-5" />
                      </div>
                      <p className="mt-2 text-xs font-bold text-slate-800">No campaigns yet</p>
                      <p className="text-xs text-slate-500">Create your first multilingual broadcast.</p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate("/campaigns/wizard")}
                        className="mt-3"
                      >
                        Launch Wizard
                      </Button>
                    </td>
                  </tr>
                ) : (
                  recentCampaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="font-bold text-slate-900 line-clamp-1">{c.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          <GlobeIcon className="w-3 h-3 text-brand-600" />
                          {c.content_count || 1} Lang{c.content_count !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={STATUS_VARIANTS[c.status] || "default"}
                          size="sm"
                        >
                          <span className="capitalize">{c.status}</span>
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/campaigns/${c.id}/monitor`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
                        >
                          Monitor <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Multilingual Reach & Gateway Infrastructure */}
        <div className="space-y-6">
          {/* Language Breakdown */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-sm font-extrabold text-slate-900 tracking-tight">
                  Languages
                </h3>
                <p className="text-xs text-slate-500">Reach by dialect</p>
              </div>
              <GlobeIcon className="w-4 h-4 text-brand-600" />
            </div>

            <div className="mt-3.5 space-y-2.5">
              {LANGUAGE_DISTRIBUTION.map((lang) => (
                <div key={lang.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{lang.name}</span>
                    <span className="font-bold text-slate-900">{lang.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${lang.barGradient} transition-all duration-500`}
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Broadcast Gateways Telemetry */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-sm font-extrabold text-slate-900 tracking-tight">
                  Gateways
                </h3>
                <p className="text-xs text-slate-500">Channel status</p>
              </div>
              <RadioIcon className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="mt-3.5 space-y-2.5">
              {GATEWAYS.map((gateway) => (
                <div
                  key={gateway.name}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs hover:border-slate-200 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{gateway.name}</p>
                    <p className="text-[10px] text-slate-500">{gateway.provider} · {gateway.latency}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {gateway.health}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
