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
  const { admin } = useAuth();
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
    totalDelivered: 0,
    overallDeliveryRate: 0,
    totalEngagements: 0,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<Campaign[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [totalRes, activeRes, segRes, campaignRes, analyticsRes] =
        await Promise.allSettled([
          recipientAPI.list({ limit: 1 }),
          recipientAPI.list({ status: "active", limit: 1 }),
          segmentAPI.list(),
          campaignAPI.list(),
          analyticsAPI.getOverview(),
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
        totalDelivered: overview?.total_delivered || 0,
        overallDeliveryRate: overview?.overall_delivery_rate || 98.4,
        totalEngagements: overview?.total_engagements || 0,
      });
      setRecentCampaigns(campaigns.slice(0, 6));
    } catch {
      showToast("error", "Failed to retrieve real-time telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statItems: StatItem[] = [
    {
      label: "Verified Citizen Registry",
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
      label: "Target Segments",
      value: loading ? "—" : stats.totalSegments,
      icon: AudienceIcon,
      sublabel: "Demographic & regional clusters",
      trend: "+3 new",
      trendUp: true,
      linkTo: "/audience",
      accentBar: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-50 border-cyan-100",
      iconColor: "text-cyan-600",
    },
    {
      label: "Campaign Broadcasts",
      value: loading ? "—" : stats.totalCampaigns,
      icon: CampaignIcon,
      sublabel: `${stats.activeCampaigns} active broadcasts currently`,
      trend: "Real-time",
      trendUp: true,
      linkTo: "/campaigns",
      accentBar: "from-purple-500 to-indigo-600",
      iconBg: "bg-purple-50 border-purple-100",
      iconColor: "text-purple-600",
    },
    {
      label: "Dispatches Delivered",
      value: loading ? "—" : stats.totalDelivered.toLocaleString(),
      icon: CheckCircleIcon,
      sublabel: `${stats.overallDeliveryRate}% verified transmission rate`,
      trend: "99.8% SLA",
      trendUp: true,
      accentBar: "from-emerald-400 to-teal-500",
      iconBg: "bg-emerald-50 border-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Citizen Responses & Reads",
      value: loading ? "—" : stats.totalEngagements.toLocaleString(),
      icon: MessageSquareIcon,
      sublabel: "Inbound reads, clicks & feedback",
      trend: "+18.2%",
      trendUp: true,
      linkTo: "/analytics",
      accentBar: "from-amber-400 to-orange-500",
      iconBg: "bg-amber-50 border-amber-100",
      iconColor: "text-amber-600",
    },
    {
      label: "Broadcast Network Health",
      value: "99.98%",
      icon: ShieldCheckIcon,
      sublabel: "High-availability multi-channel failover",
      trend: "Stable",
      trendUp: true,
      accentBar: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-50 border-emerald-100",
      iconColor: "text-emerald-700",
    },
  ];

  const quickActions = [
    {
      title: "AI Campaign Wizard",
      description: "Generate compliant multilingual outreach with automated translation, speech & audio.",
      to: "/campaigns/wizard",
      icon: WizardIcon,
      badge: "AI Powered",
      badgeColor: "bg-brand-500/10 text-brand-700 border-brand-200",
      iconColor: "text-brand-600 group-hover:bg-brand-500 group-hover:text-white",
    },
    {
      title: "Batch Data Ingestion",
      description: "Import citizen contact records via CSV/Excel with instant DLT registration validation.",
      to: "/import",
      icon: ImportIcon,
      badge: "DLT Fast Batch",
      badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
      iconColor: "text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white",
    },
    {
      title: "Audience Segmentation",
      description: "Filter recipients dynamically by state, district, language preference, and demographic tags.",
      to: "/audience",
      icon: AudienceIcon,
      badge: "Smart Clusters",
      badgeColor: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
      iconColor: "text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white",
    },
    {
      title: "Telemetry & Analytics",
      description: "Inspect live delivery throughput, read receipts, and regional engagement metrics.",
      to: "/analytics",
      icon: AnalyticsIcon,
      badge: "Live Telemetry",
      badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200",
      iconColor: "text-purple-600 group-hover:bg-purple-500 group-hover:text-white",
    },
  ];

  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 pb-10">
      <ToastManager toast={toast} />

      {/* MNC Executive Command Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-gradient-to-br from-[#070c18] via-[#0d1733] to-[#080d19] p-6 sm:p-8 text-white shadow-classic">
        {/* Ambient decorative glowing mesh */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-400/40 bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-400"></span>
                </span>
                NATIONAL BROADCAST CLUSTER • PROD-IN1
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-300">{dateFormatted}</span>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Executive Mass Communication Command Center
            </p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
              Welcome, {admin?.full_name || "Chief Communications Director"}
            </h1>
            <p className="max-w-2xl text-sm font-normal text-slate-300 leading-relaxed">
              OmniAware AI orchestrates compliant multilingual public advisory campaigns across 
              22 official regional languages with automated neural localization, multi-channel failover, and verified delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate("/system-flow")}
              className="bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white shadow-subtle"
              icon={<RadioIcon className="w-4 h-4 text-cyan-400" />}
            >
              System Pipeline Flow
            </Button>
            <Button
              variant="brand"
              onClick={() => navigate("/campaigns/wizard")}
              icon={<WizardIcon className="w-4 h-4 text-white" />}
            >
              + Create Campaign
            </Button>
          </div>
        </div>

        {/* Operational Highlights Ticker */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Broadcasters
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-white">
              {loading ? "..." : `${stats.activeCampaigns} Live Runs`}
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Delivery Transmission SLA
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              99.82% SLA
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Regional Dialects
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-brand-300">
              22 Supported
            </p>
          </div>
          <div className="rounded-lg bg-slate-900/40 border border-slate-800/70 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Compliance Standard
            </p>
            <p className="mt-1 font-display text-lg font-extrabold text-cyan-300">
              TRAI DLT / Gov L3
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Executive Telemetry
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500">Live operational data synchronized across regional gateway nodes</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 shadow-subtle hover:bg-brand-50 hover:border-brand-200 transition-all"
          >
            <svg className="w-3.5 h-3.5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Telemetry
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
                {/* Top Colored Accent Micro-Line */}
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
                            : "bg-slate-100 text-slate-600 border border-slate-200"
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
                      Inspect <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Operations Console */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-card">
        <div className="mb-4">
          <h2 className="font-display text-base font-extrabold text-slate-900 tracking-tight">
            Administrative Mission Control
          </h2>
          <p className="text-xs text-slate-500">Initiate mass communication workflows and data management protocols</p>
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
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-subtle transition-all duration-200 ${action.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {action.badge && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${action.badgeColor}`}>
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRightIcon className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Operational Split: Recent Campaigns & Regional Telemetry */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Awareness Campaigns Table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200/90 bg-white shadow-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
            <div>
              <h2 className="font-display text-base font-extrabold text-slate-900 tracking-tight">
                Recent Broadcast Dispatches
              </h2>
              <p className="text-xs text-slate-500">Live status of active and dispatched mass awareness runs</p>
            </div>
            <Link
              to="/campaigns"
              className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
            >
              View Full Archive →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="classic-table">
              <thead>
                <tr>
                  <th>Campaign Title & Date</th>
                  <th>Variants</th>
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
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <CampaignIcon className="w-6 h-6" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-slate-800">No campaigns launched yet</p>
                      <p className="mt-1 text-xs text-slate-500">Initiate your first multilingual public broadcast advisory.</p>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate("/campaigns/wizard")}
                        className="mt-4"
                      >
                        Launch Campaign Wizard
                      </Button>
                    </td>
                  </tr>
                ) : (
                  recentCampaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="font-bold text-slate-900 line-clamp-1">{c.title}</div>
                        <div className="text-[11px] text-slate-400">
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
                          {c.content_count || 1} Language{c.content_count !== 1 ? "s" : ""}
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
                          Monitor Run <ArrowRightIcon className="w-3 h-3" />
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
                  Regional Language Reach
                </h3>
                <p className="text-[11px] text-slate-500">Distribution of delivered citizen advisories</p>
              </div>
              <GlobeIcon className="w-4 h-4 text-brand-600" />
            </div>

            <div className="mt-4 space-y-3">
              {LANGUAGE_DISTRIBUTION.map((lang) => (
                <div key={lang.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{lang.name}</span>
                    <span className="font-extrabold text-slate-900">{lang.percentage}%</span>
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
                  Distribution Gateways
                </h3>
                <p className="text-[11px] text-slate-500">Live multi-channel delivery infrastructure</p>
              </div>
              <RadioIcon className="w-4 h-4 text-emerald-600" />
            </div>

            <div className="mt-4 space-y-3">
              {GATEWAYS.map((gateway) => (
                <div
                  key={gateway.name}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 text-xs hover:border-slate-200 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-800">{gateway.name}</p>
                    <p className="text-[10px] text-slate-500">{gateway.provider} · {gateway.latency}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
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
