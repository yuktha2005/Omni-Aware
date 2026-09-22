import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { recipientAPI, segmentAPI, campaignAPI, analyticsAPI } from "../../services/apiService";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  linkTo?: string;
  sublabel?: string;
}

interface Campaign {
  id: number;
  title: string;
  status: string;
  created_at: string;
  content_count: number;
}

const STATUS_STYLES: Record<string, string> = {
  completed:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
  running:    "bg-blue-50 text-blue-700 border border-blue-200",
  scheduled:  "bg-violet-50 text-violet-700 border border-violet-200",
  queued:     "bg-amber-50 text-amber-700 border border-amber-200",
  draft:      "bg-slate-50 text-slate-600 border border-slate-200",
  failed:     "bg-red-50 text-red-700 border border-red-200",
  cancelled:  "bg-slate-50 text-slate-500 border border-slate-200",
};

const DashboardHome = () => {
  const { admin } = useAuth();
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
      const [totalRes, activeRes, segRes, campaignRes, analyticsRes] = await Promise.allSettled([
        recipientAPI.list({ limit: 1 }),
        recipientAPI.list({ status: "active", limit: 1 }),
        segmentAPI.list(),
        campaignAPI.list(),
        analyticsAPI.getOverview(),
      ]);

      const total = totalRes.status === "fulfilled" ? totalRes.value.data.total : 0;
      const active = activeRes.status === "fulfilled" ? activeRes.value.data.total : 0;
      const segs = segRes.status === "fulfilled" ? segRes.value.data.length : 0;
      const campaigns: Campaign[] = campaignRes.status === "fulfilled" ? campaignRes.value.data : [];
      const overview = analyticsRes.status === "fulfilled" ? analyticsRes.value.data : null;

      setStats({
        totalRecipients: total,
        activeRecipients: active,
        totalSegments: segs,
        totalCampaigns: campaigns.length,
        completedCampaigns: campaigns.filter((c) => c.status === "completed").length,
        activeCampaigns: campaigns.filter((c) => ["running", "queued", "scheduled"].includes(c.status)).length,
        totalDelivered: overview?.total_delivered || 0,
        overallDeliveryRate: overview?.overall_delivery_rate || 0,
        totalEngagements: overview?.total_engagements || 0,
      });
      setRecentCampaigns(campaigns.slice(0, 6));
    } catch {
      showToast("error", "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards: StatCard[] = [
    {
      label: "Total Recipients",
      value: loading ? "—" : stats.totalRecipients.toLocaleString(),
      icon: "👥",
      color: "text-sky-700",
      bgColor: "bg-sky-50",
      linkTo: "/recipients",
      sublabel: `${stats.activeRecipients.toLocaleString()} active`,
    },
    {
      label: "Audience Segments",
      value: loading ? "—" : stats.totalSegments,
      icon: "🎯",
      color: "text-violet-700",
      bgColor: "bg-violet-50",
      linkTo: "/audience",
      sublabel: "Defined segments",
    },
    {
      label: "Total Campaigns",
      value: loading ? "—" : stats.totalCampaigns,
      icon: "📣",
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      linkTo: "/campaigns",
      sublabel: `${stats.activeCampaigns} active now`,
    },
    {
      label: "Messages Delivered",
      value: loading ? "—" : stats.totalDelivered.toLocaleString(),
      icon: "✅",
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      sublabel: `${stats.overallDeliveryRate}% delivery rate`,
    },
    {
      label: "Total Engagements",
      value: loading ? "—" : stats.totalEngagements.toLocaleString(),
      icon: "💬",
      color: "text-rose-700",
      bgColor: "bg-rose-50",
      linkTo: "/analytics",
      sublabel: "Opens, clicks & responses",
    },
    {
      label: "Campaigns Completed",
      value: loading ? "—" : stats.completedCampaigns,
      icon: "🏁",
      color: "text-slate-700",
      bgColor: "bg-slate-100",
      linkTo: "/campaigns",
      sublabel: "Successfully delivered",
    },
  ];

  const quickActions = [
    { label: "New Campaign", icon: "🚀", to: "/campaigns/wizard", color: "bg-sky-600 hover:bg-sky-700 text-white" },
    { label: "Import Recipients", icon: "📥", to: "/import", color: "bg-violet-600 hover:bg-violet-700 text-white" },
    { label: "View Analytics", icon: "📊", to: "/analytics", color: "bg-emerald-600 hover:bg-emerald-700 text-white" },
    { label: "Manage Segments", icon: "🎯", to: "/audience", color: "bg-amber-600 hover:bg-amber-700 text-white" },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <ToastManager toast={toast} />

      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">
          {greeting}, {admin?.full_name?.split(" ")[0] || "Admin"} 👋
        </h1>
        <p className="text-sm text-slate-500">
          Here's what's happening with your communication campaigns today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-soft backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  {card.label}
                </p>
                <p className={`mt-1 text-3xl font-bold ${card.color}`}>
                  {loading ? (
                    <span className="inline-block h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
                  ) : (
                    card.value
                  )}
                </p>
                {card.sublabel && (
                  <p className="mt-1 text-xs text-slate-400">{card.sublabel}</p>
                )}
              </div>
              <div className={`rounded-xl p-3 text-2xl ${card.bgColor}`}>
                {card.icon}
              </div>
            </div>
            {card.linkTo && (
              <Link
                to={card.linkTo}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 transition-colors hover:text-sky-600"
              >
                View details <span>→</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-soft backdrop-blur-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-center text-sm font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md ${action.color}`}
            >
              <span className="text-2xl">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-soft backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-700">Recent Campaigns</h2>
          <Link
            to="/campaigns"
            className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-16 animate-pulse rounded-full bg-slate-100" />
              </div>
            ))
          ) : recentCampaigns.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-400 text-sm">No campaigns yet.</p>
              <Link to="/campaigns/wizard" className="mt-2 inline-block text-sm font-medium text-sky-600 hover:underline">
                Create your first campaign →
              </Link>
            </div>
          ) : (
            recentCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-slate-50/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{campaign.title}</p>
                  <p className="text-xs text-slate-400">
                    {campaign.content_count} content variant{campaign.content_count !== 1 ? "s" : ""} ·{" "}
                    {new Date(campaign.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                      STATUS_STYLES[campaign.status] || STATUS_STYLES.draft
                    }`}
                  >
                    {campaign.status}
                  </span>
                  <Link
                    to={`/campaigns/${campaign.id}/monitor`}
                    className="text-xs font-medium text-sky-500 hover:text-sky-700"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
