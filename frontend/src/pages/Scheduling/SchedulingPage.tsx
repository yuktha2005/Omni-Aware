import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { campaignAPI, distributionAPI } from "../../services/apiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import StatsCard from "../../components/ui/StatsCard";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import type { Campaign } from "../../types/campaign";
import type { WebBroadcast } from "../../types/distribution";

const SchedulingPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [broadcasts, setBroadcasts] = useState<WebBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, bRes] = await Promise.all([
        campaignAPI.list(),
        distributionAPI.getActiveBroadcasts(),
      ]);
      setCampaigns(cRes.data);
      setBroadcasts(bRes.data);
    } catch (err: any) {
      showToast("error", "Failed to load scheduling data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerNow = async (campaignId: number) => {
    try {
      setActionId(campaignId);
      await distributionAPI.distribute(campaignId);
      showToast("success", `Campaign #${campaignId} queued for immediate execution!`);
      fetchData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Trigger failed");
    } finally {
      setActionId(null);
    }
  };

  const scheduledCampaigns = campaigns.filter((c) =>
    ["scheduled", "queued", "running"].includes(c.status.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaign Scheduling & Queue</h1>
          <p className="text-sm text-slate-500">
            Manage scheduled awareness broadcasts, active time slots, and web announcements.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate("/campaigns/new")}>
            + Schedule New Campaign
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          title="Scheduled / In Queue"
          value={scheduledCampaigns.length}
        />
        <StatsCard
          title="Active Web Broadcasts"
          value={broadcasts.length}
        />
        <StatsCard
          title="Total Lifetime Campaigns"
          value={campaigns.length}
        />
      </div>

      {/* Scheduled Campaigns Table */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Active Scheduled & Queued Campaigns ({scheduledCampaigns.length})
        </h2>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : scheduledCampaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
            No campaigns currently scheduled or running in background.
            <div className="mt-3">
              <Button size="sm" variant="primary" onClick={() => navigate("/campaigns/new")}>
                Schedule a Campaign
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Scheduled Time</th>
                  <th className="px-4 py-3">Timezone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduledCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-400">{c.purpose}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : "Immediate Queue"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">
                      {c.scheduled_timezone || "Asia/Kolkata"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === "running" ? "info" : "warning"}>
                        {c.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status.toLowerCase() !== "running" && (
                          <Button
                            size="sm"
                            variant="primary"
                            loading={actionId === c.id}
                            onClick={() => handleTriggerNow(c.id)}
                          >
                            Execute Now
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/campaigns/${c.id}/monitor`)}
                        >
                          Monitor
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Active Web Broadcasts Widget */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Live Web Broadcast Announcements</h2>
        <p className="text-xs text-slate-500 mb-4">
          Public notices broadcasted on the civic web portal.
        </p>

        {broadcasts.length === 0 ? (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No active web broadcasts currently published.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white p-4 space-y-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-900">{b.title}</span>
                  <Badge variant="success">Active Live</Badge>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{b.body}</p>
                <div className="flex items-center justify-between pt-2 border-t border-indigo-100 text-xs text-slate-500">
                  <span>Language: <strong>{b.language}</strong></span>
                  <span>👁️ Views: <strong>{b.views_count}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ToastManager toast={toast} />
    </div>
  );
};

export default SchedulingPage;
