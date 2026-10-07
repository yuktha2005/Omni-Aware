import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { analyticsAPI, campaignAPI } from "../../services/apiService";
import Card from "../../components/ui/Card";
import StatsCard from "../../components/ui/StatsCard";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import { UnderstandingAnalyticsCard } from "../../components/campaigns/UnderstandingAnalyticsCard";
import type { CampaignAnalytics, PlatformOverview } from "../../types/analytics";
import type { Campaign } from "../../types/campaign";

const AnalyticsDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCampaignId = searchParams.get("campaignId");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId || "");
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [platformOverview, setPlatformOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const { toast, showToast } = useToast();

  const fetchCampaignsList = async () => {
    try {
      const res = await campaignAPI.list();
      setCampaigns(res.data);
      if (!selectedCampaignId && res.data.length > 0) {
        setSelectedCampaignId(res.data[0].id.toString());
      }
    } catch (err) {
      // Ignore
    }
  };

  const fetchAnalytics = async (campId: string) => {
    try {
      setLoading(true);
      const [overviewRes, campAnalyticsRes] = await Promise.all([
        analyticsAPI.getOverview(),
        campId ? analyticsAPI.getCampaignAnalytics(parseInt(campId, 10)) : Promise.resolve({ data: null }),
      ]);

      setPlatformOverview(overviewRes.data);
      setAnalytics(campAnalyticsRes.data);
    } catch (err: any) {
      showToast("error", "Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsList();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchAnalytics(selectedCampaignId);
      setSearchParams({ campaignId: selectedCampaignId });
    } else {
      analyticsAPI.getOverview().then((res) => {
        setPlatformOverview(res.data);
        setLoading(false);
      });
    }
  }, [selectedCampaignId]);

  return (
    <div className="space-y-6">
      {/* Top Header & Campaign Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engagement & Distribution Analytics</h1>
          <p className="text-sm text-slate-500">
            Multi-channel performance, language adoption, audience reach, and delivery telemetry insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase text-slate-500">Campaign:</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-primary-500 focus:outline-none shadow-sm"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.id} - {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Card className="p-6">
          <LoadingSkeleton rows={6} />
        </Card>
      ) : (
        <>
          {/* Platform High-Level Summary */}
          {platformOverview && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/75 px-4 py-2.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Platform Lifetime Reach:</span>
              <div className="flex flex-wrap gap-4">
                <span>Total Campaigns: <strong className="text-slate-900">{platformOverview.total_campaigns}</strong></span>
                <span>Total Broadcasts: <strong className="text-slate-900">{platformOverview.total_dispatches}</strong></span>
                <span>Avg Delivery: <strong className="text-emerald-700">{platformOverview.overall_delivery_rate}%</strong></span>
                <span>Engagements: <strong className="text-indigo-700">{platformOverview.total_engagements}</strong></span>
              </div>
            </div>
          )}

          {/* Key Metric KPI Cards */}
          {analytics && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatsCard
                title="Total Delivered"
                value={analytics.summary.total_delivered}
                subtitle={`${analytics.summary.delivery_rate}% Delivery Rate`}
                accentColor="emerald"
              />
              <StatsCard
                title="Delivery Rate"
                value={`${analytics.summary.delivery_rate}%`}
                subtitle={`${analytics.summary.total_failed} Failed`}
                accentColor="cyan"
              />
              <StatsCard
                title="Email/Push Opens"
                value={
                  typeof analytics.summary.open_rate === "number"
                    ? `${analytics.summary.open_rate}%`
                    : analytics.summary.open_rate
                }
                subtitle={`${analytics.summary.total_opened} Opens`}
                accentColor="indigo"
              />
              <StatsCard
                title="Click-Through Rate"
                value={
                  typeof analytics.summary.click_rate === "number"
                    ? `${analytics.summary.click_rate}%`
                    : analytics.summary.click_rate
                }
                subtitle={`${analytics.summary.total_clicked} Clicks`}
                accentColor="violet"
              />
              <StatsCard
                title="Citizen Response Rate"
                value={`${analytics.summary.response_rate}%`}
                subtitle={`${analytics.summary.total_responded} Responses`}
                accentColor="amber"
              />
            </div>
          )}

          {/* Channel Performance Breakdown */}
          {analytics && (
            <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-card transition-all duration-200 hover:shadow-soft">
              {/* Top Accent Micro-Line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-500 to-indigo-600" />

              <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    Multi-Channel Distribution Performance
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h2>
                  <p className="text-xs text-slate-500">Telemetry aggregated across verified carrier and protocol gateways</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-subtle">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  Consent & Policy Enforced
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="classic-table">
                  <thead>
                    <tr>
                      <th>Gateway Channel</th>
                      <th>Sent</th>
                      <th>Delivered</th>
                      <th>Delivery Rate</th>
                      <th>Open Rate</th>
                      <th>Click Rate</th>
                      <th>Citizen Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.channels.map((ch) => {
                      const isEmail = ch.channel.toLowerCase().includes("email");
                      const isWeb = ch.channel.toLowerCase().includes("web");
                      const isSMS = ch.channel.toLowerCase().includes("sms");
                      const isWhatsApp = ch.channel.toLowerCase().includes("whatsapp");

                      const delivRate = Number(ch.delivery_rate) || 0;

                      return (
                        <tr key={ch.channel} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border shadow-subtle ${
                                  isEmail
                                    ? "bg-brand-50 border-brand-200 text-brand-600"
                                    : isWeb
                                    ? "bg-cyan-50 border-cyan-200 text-cyan-600"
                                    : isWhatsApp
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                    : "bg-amber-50 border-amber-200 text-amber-600"
                                }`}
                              >
                                {isEmail ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                ) : isWeb ? (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">
                                  {ch.channel}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                  {isEmail ? "Gov-SMTP Relay" : isWeb ? "Public Web Portal" : isSMS ? "TRAI DLT" : "Carrier API"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">{ch.sent.toLocaleString()}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">{ch.delivered.toLocaleString()}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold border ${
                                delivRate >= 80
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                                  : delivRate > 0
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  delivRate >= 80 ? "bg-emerald-500" : delivRate > 0 ? "bg-amber-500" : "bg-slate-400"
                                }`}
                              />
                              {delivRate}%
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {typeof ch.open_rate === "number" ? (
                              <span className="font-bold text-slate-700">{ch.open_rate}%</span>
                            ) : (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                {ch.open_rate}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {typeof ch.click_rate === "number" ? (
                              <span className="font-bold text-slate-700">{ch.click_rate}%</span>
                            ) : (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                                {ch.click_rate}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-800">{ch.response_rate}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Language & Audience Breakdown Grid */}
          {analytics && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Language Breakdown */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Language-wise Analytics</h2>
                    <p className="text-xs text-slate-500">Scheduled broadcast languages configured for this campaign</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                    {analytics.languages.length} Languages
                  </span>
                </div>
                <div className="space-y-3">
                  {analytics.languages.map((l) => (
                    <div
                      key={l.language}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-950">{l.language}</span>
                          <span className="rounded bg-indigo-100/80 px-1.5 py-0.2 text-[10px] font-bold text-indigo-800 uppercase">
                            {l.language_code}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {l.delivered} Delivered ({l.delivery_rate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(l.delivery_rate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Recipients: <strong className="text-slate-700">{l.recipient_count}</strong></span>
                        <span>Engagement: <strong className="text-indigo-700">{l.engagement_count} ({l.engagement_rate}%)</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Audience Breakdown */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Audience Persona Breakdown</h2>
                    <p className="text-xs text-slate-500">Scheduled recipient personas & target groups for this campaign</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    {analytics.audiences.length} Personas
                  </span>
                </div>
                <div className="space-y-3">
                  {analytics.audiences.map((a) => (
                    <div
                      key={a.segment_name}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-slate-900">{a.segment_name}</span>
                        <span className="text-xs font-bold text-slate-700">
                          {a.delivered} Delivered ({a.delivery_rate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(a.delivery_rate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Target Pool: <strong className="text-slate-700">{a.recipient_count}</strong></span>
                        <span>Engagement: <strong className="text-emerald-700">{a.engagement_count} ({a.engagement_rate}%)</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Citizen Understanding Score & Comprehension Analytics */}
          {selectedCampaignId && (
            <UnderstandingAnalyticsCard
              campaignId={parseInt(selectedCampaignId, 10)}
            />
          )}
        </>
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

export default AnalyticsDashboardPage;
