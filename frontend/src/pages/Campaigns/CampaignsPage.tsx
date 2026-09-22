import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { campaignAPI, distributionAPI } from "../../services/apiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useToast } from "../../hooks/useToast";
import { ToastManager } from "../../components/ui/Toast";
import ErrorState from "../../components/ui/ErrorState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import type { Campaign } from "../../types/campaign";

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  
  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await campaignAPI.list();
      setCampaigns(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to load campaigns list";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleQuickDistribute = async (campaignId: number) => {
    try {
      setActionLoadingId(campaignId);
      await distributionAPI.distribute(campaignId);
      showToast("success", `Campaign #${campaignId} queued for background distribution!`);
      fetchCampaigns();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to trigger distribution";
      showToast("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "running":
        return <Badge variant="info">Running</Badge>;
      case "scheduled":
      case "queued":
        return <Badge variant="warning">{status.toUpperCase()}</Badge>;
      case "failed":
        return <Badge variant="danger">Failed</Badge>;
      case "cancelled":
        return <Badge variant="default">Cancelled</Badge>;
      default:
        return <Badge variant="default">Draft</Badge>;
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.purpose.toLowerCase().includes(search.toLowerCase()) ||
      (c.target_audience && c.target_audience.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || c.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaign Management</h1>
          <p className="text-sm text-slate-500">
            Create, schedule, broadcast, and monitor multilingual awareness campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCampaigns}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => navigate("/campaigns/new")}>
            + AI Campaign Wizard
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search campaigns by title, purpose, or audience..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Campaign List */}
      {loading ? (
        <Card className="p-6">
          <LoadingSkeleton rows={5} />
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCampaigns} />
      ) : filteredCampaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-base font-semibold text-slate-700">No campaigns found</p>
          <p className="mt-1 text-sm text-slate-500">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter settings."
              : "Launch your first AI multilingual awareness campaign now!"}
          </p>
          <div className="mt-4">
            <Button variant="primary" onClick={() => navigate("/campaigns/new")}>
              Launch AI Campaign
            </Button>
          </div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Campaign</th>
                  <th className="px-4 py-3">Audience & Lang</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Multilingual Contents</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{c.purpose}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-700">{c.target_audience || "General Public"}</div>
                      <div className="text-xs text-slate-400">{c.desired_language || "English"}</div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(c.status)}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                        {c.content_count || 1} Variations
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status.toLowerCase() === "running" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/campaigns/${c.id}/monitor`)}
                          >
                            Live Monitor
                          </Button>
                        ) : c.status.toLowerCase() === "draft" ? (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={actionLoadingId === c.id}
                            onClick={() => handleQuickDistribute(c.id)}
                          >
                            Distribute
                          </Button>
                        ) : null}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/analytics?campaignId=${c.id}`)}
                        >
                          Analytics
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
        </div>
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

export default CampaignsPage;
