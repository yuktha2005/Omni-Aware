import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { distributionAPI } from "../../services/apiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import StatsCard from "../../components/ui/StatsCard";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import ErrorState from "../../components/ui/ErrorState";
import type { CampaignMonitoringData } from "../../types/distribution";

const CampaignMonitoringPage = () => {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || "0", 10);
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [data, setData] = useState<CampaignMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMonitoring = async () => {
    if (!campaignId) return;
    try {
      setError("");
      const res = await distributionAPI.getMonitoring(campaignId);
      setData(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to load campaign monitoring data";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 5000); // Poll every 5s for live updates
    return () => clearInterval(interval);
  }, [campaignId]);

  const handleRetry = async () => {
    try {
      setActionLoading(true);
      const res = await distributionAPI.retry(campaignId);
      showToast(
        "success",
        `Retried ${res.data.re_attempted_count} messages (${res.data.recovered_count} recovered).`
      );
      fetchMonitoring();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Retry failed";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this campaign? Pending deliveries will be stopped.")) {
      return;
    }
    try {
      setActionLoading(true);
      await distributionAPI.cancel(campaignId);
      showToast("success", "Campaign cancelled successfully.");
      fetchMonitoring();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to cancel campaign";
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <LoadingSkeleton rows={6} />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <>
        <ErrorState message={error || "Campaign not found"} onRetry={fetchMonitoring} />
        <ToastManager toast={toast} />
      </>
    );
  }

  const { metrics, progress_percent } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{data.title}</h1>
            <Badge variant={data.status === "completed" ? "success" : data.status === "running" ? "info" : "warning"}>
              {data.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Campaign ID: #{data.campaign_id} • Live Delivery Monitoring & Failure Drilldown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/analytics?campaignId=${campaignId}`)}>
            View Analytics →
          </Button>
          {metrics.failed > 0 && (
            <Button variant="primary" size="sm" loading={actionLoading} onClick={handleRetry}>
              🔄 Retry Failures ({metrics.failed})
            </Button>
          )}
          {data.status === "running" && (
            <Button variant="outline" size="sm" loading={actionLoading} onClick={handleCancel}>
              Cancel Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-800">Overall Broadcast Progress</span>
          <span className="text-sm font-bold text-primary-700">{progress_percent}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${Math.min(progress_percent, 100)}%` }}
          />
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatsCard title="Total Dispatches" value={metrics.total} />
        <StatsCard title="Delivered" value={metrics.delivered} />
        <StatsCard title="In Progress" value={metrics.sending + metrics.queued} />
        <StatsCard title="Retrying" value={metrics.retrying} />
        <StatsCard title="Failed" value={metrics.failed} />
        <StatsCard title="Cancelled" value={metrics.cancelled} />
      </div>

      {/* Failures & Retries Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Delivery Failure / Retry Log ({data.recent_failures.length})
          </h2>
          <span className="text-xs text-slate-500">Auto-refreshes every 5 seconds</span>
        </div>

        {data.recent_failures.length === 0 ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-6 text-center text-sm text-emerald-800">
            ✓ No delivery failures detected. All communications dispatched cleanly!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Delivery ID</th>
                  <th className="px-3 py-2">Recipient ID</th>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Attempts</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_failures.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono">#{f.id}</td>
                    <td className="px-3 py-2 font-mono">#{f.recipient_id}</td>
                    <td className="px-3 py-2 uppercase font-semibold">{f.channel}</td>
                    <td className="px-3 py-2">
                      {f.attempt_count} (Retries: {f.retry_count})
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={f.status === "RETRYING" ? "warning" : "danger"}>
                        {f.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-red-600 font-medium">{f.failure_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ToastManager toast={toast} />
    </div>
  );
};

export default CampaignMonitoringPage;
