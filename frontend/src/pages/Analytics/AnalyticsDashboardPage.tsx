import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { analyticsAPI, campaignAPI } from "../../services/apiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import StatsCard from "../../components/ui/StatsCard";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import type { CampaignAnalytics, PlatformOverview, FeedbackItem } from "../../types/analytics";
import type { Campaign } from "../../types/campaign";

const AnalyticsDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCampaignId = searchParams.get("campaignId");

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId || "");
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [platformOverview, setPlatformOverview] = useState<PlatformOverview | null>(null);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback Submission Modal State
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
      const [overviewRes, campAnalyticsRes, feedbacksRes] = await Promise.all([
        analyticsAPI.getOverview(),
        campId ? analyticsAPI.getCampaignAnalytics(parseInt(campId, 10)) : Promise.resolve({ data: null }),
        campId ? analyticsAPI.getFeedbacks(parseInt(campId, 10)) : Promise.resolve({ data: { feedbacks: [] } }),
      ]);

      setPlatformOverview(overviewRes.data);
      setAnalytics(campAnalyticsRes.data);
      setFeedbacks(feedbacksRes.data?.feedbacks || []);
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

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() || !selectedCampaignId) return;

    try {
      setSubmittingFeedback(true);
      const res = await analyticsAPI.submitFeedback(parseInt(selectedCampaignId, 10), {
        feedback_text: feedbackText,
        rating: feedbackRating,
        channel: "web",
      });
      showToast("success", `Feedback evaluated as ${res.data.sentiment.toUpperCase()} sentiment!`);
      setFeedbackText("");
      fetchAnalytics(selectedCampaignId);
    } catch (err: any) {
      showToast("error", "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Campaign Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Engagement & Distribution Analytics</h1>
          <p className="text-sm text-slate-500">
            Multi-channel performance, language adoption, audience reach, and audience sentiment insights.
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatsCard
                title="Total Delivered"
                value={analytics.summary.total_delivered}
                subtitle={`${analytics.summary.delivery_rate}% Delivery Rate`}
              />
              <StatsCard
                title="Delivery Rate"
                value={`${analytics.summary.delivery_rate}%`}
                subtitle={`${analytics.summary.total_failed} Failed`}
              />
              <StatsCard
                title="Email/Push Open Rate"
                value={
                  typeof analytics.summary.open_rate === "number"
                    ? `${analytics.summary.open_rate}%`
                    : analytics.summary.open_rate
                }
                subtitle={`${analytics.summary.total_opened} Opens`}
              />
              <StatsCard
                title="Click-Through Rate"
                value={
                  typeof analytics.summary.click_rate === "number"
                    ? `${analytics.summary.click_rate}%`
                    : analytics.summary.click_rate
                }
                subtitle={`${analytics.summary.total_clicked} Clicks`}
              />
              <StatsCard
                title="Response Rate"
                value={`${analytics.summary.response_rate}%`}
                subtitle={`${analytics.summary.total_responded} Responses`}
              />
              <StatsCard
                title="Audience Sentiment"
                value={`${analytics.feedback.positive_percentage}% Pos`}
                subtitle={`${analytics.feedback.total_feedbacks} Feedbacks`}
              />
            </div>
          )}

          {/* Channel Performance Breakdown */}
          {analytics && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Multi-Channel Distribution Performance</h2>
                <span className="text-xs text-slate-400">Respects recipient consent & channel capability</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Channel</th>
                      <th className="px-4 py-3">Sent</th>
                      <th className="px-4 py-3">Delivered</th>
                      <th className="px-4 py-3">Delivery Rate</th>
                      <th className="px-4 py-3">Open Rate</th>
                      <th className="px-4 py-3">Click Rate</th>
                      <th className="px-4 py-3">Response Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.channels.map((ch) => (
                      <tr key={ch.channel} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-900">{ch.channel}</td>
                        <td className="px-4 py-3 text-slate-700">{ch.sent}</td>
                        <td className="px-4 py-3 text-slate-700">{ch.delivered}</td>
                        <td className="px-4 py-3 font-medium text-emerald-600">
                          {ch.delivery_rate}%
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                          {typeof ch.open_rate === "number" ? `${ch.open_rate}%` : ch.open_rate}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                          {typeof ch.click_rate === "number" ? `${ch.click_rate}%` : ch.click_rate}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                          {ch.response_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Language & Audience Breakdown Grid */}
          {analytics && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Language Breakdown */}
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">Language-wise Analytics</h2>
                <div className="space-y-3">
                  {analytics.languages.map((l) => (
                    <div
                      key={l.language}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-indigo-900">{l.language}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {l.delivered} Delivered ({l.delivery_rate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(l.delivery_rate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Recipients: {l.recipient_count}</span>
                        <span>Engagement: {l.engagement_count} ({l.engagement_rate}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Audience Breakdown */}
              <Card className="p-6 space-y-4">
                <h2 className="text-base font-semibold text-slate-900">Audience Persona Breakdown</h2>
                <div className="space-y-3">
                  {analytics.audiences.map((a) => (
                    <div
                      key={a.segment_name}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-900">{a.segment_name}</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {a.delivered} Delivered ({a.delivery_rate}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(a.delivery_rate, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Recipients: {a.recipient_count}</span>
                        <span>Engagement: {a.engagement_count} ({a.engagement_rate}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Feedback & Sentiment Analysis Section */}
          {analytics && (
            <Card className="p-6 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Audience Feedback & Sentiment Analysis (NLP Engine)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Sentiment polarity and emotional tone classified using the Milestone 2 NLP service.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    👍 Positive: {analytics.feedback.positive_percentage}%
                  </span>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                    😐 Neutral: {analytics.feedback.neutral_percentage}%
                  </span>
                  <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded">
                    👎 Negative: {analytics.feedback.negative_percentage}%
                  </span>
                </div>
              </div>

              {/* Feedback Simulation / Ingestion Form */}
              <form onSubmit={handleFeedbackSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="font-semibold text-xs uppercase text-slate-600">Submit Test Audience Feedback</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter audience response or feedback message to evaluate sentiment..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-primary-500 focus:outline-none"
                  />
                  <select
                    value={feedbackRating}
                    onChange={(e) => setFeedbackRating(parseInt(e.target.value, 10))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs focus:outline-none"
                  >
                    <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                    <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                    <option value={3}>3 Stars ⭐⭐⭐</option>
                    <option value={2}>2 Stars ⭐⭐</option>
                    <option value={1}>1 Star ⭐</option>
                  </select>
                  <Button type="submit" size="sm" variant="primary" loading={submittingFeedback}>
                    Analyze & Record
                  </Button>
                </div>
              </form>

              {/* Feedbacks Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Feedback Text</th>
                      <th className="px-3 py-2">Sentiment</th>
                      <th className="px-3 py-2">Polarity Score</th>
                      <th className="px-3 py-2">Tone</th>
                      <th className="px-3 py-2">Rating</th>
                      <th className="px-3 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {feedbacks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                          No feedback recorded yet. Submit feedback above to evaluate live sentiment.
                        </td>
                      </tr>
                    ) : (
                      feedbacks.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-800">{f.feedback_text}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant={
                                f.sentiment === "positive"
                                  ? "success"
                                  : f.sentiment === "negative"
                                  ? "danger"
                                  : "default"
                              }
                            >
                              {f.sentiment.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-600">{f.sentiment_score}</td>
                          <td className="px-3 py-2 text-slate-600">{f.detected_tone}</td>
                          <td className="px-3 py-2 text-amber-500">
                            {f.rating ? "★".repeat(f.rating) : "-"}
                          </td>
                          <td className="px-3 py-2 text-slate-400">
                            {f.created_at ? new Date(f.created_at).toLocaleTimeString() : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

export default AnalyticsDashboardPage;
