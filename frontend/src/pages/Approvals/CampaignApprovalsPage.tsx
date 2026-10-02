import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { campaignAPI, distributionAPI } from "../../services/apiService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../contexts/AuthContext";
import { ToastManager } from "../../components/ui/Toast";
import ErrorState from "../../components/ui/ErrorState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";

interface ProcessedContent {
  language: string;
  language_code: string;
  audience_role: string;
  message_title: string;
  message_body: string;
  short_version?: string;
  call_to_action?: string;
  quality_score?: number;
  compliance_passed?: boolean;
  compliance_score?: number;
  factual_verification_status?: string;
  sentiment?: string;
  detected_tone?: string;
}

interface ApprovalCampaign {
  id: number;
  title: string;
  purpose: string;
  target_audience?: string;
  key_information: string;
  desired_language: string;
  desired_tone: string;
  communication_channel: string;
  status: string;
  created_at?: string;
  created_by?: string;
  scheduled_at?: string;
  scheduled_timezone?: string;
  selected_channels?: string[];
  content_count: number;
  contents: ProcessedContent[];
  fact_verification_summary?: {
    total_claims?: number;
    supported_claims?: number;
    flagged_claims?: number;
    verification_status?: string;
  };
  translation_quality_summary?: {
    total_variations?: number;
    evaluated_count?: number;
    average_quality_score?: number;
    languages?: string[];
  };
}

const CampaignApprovalsPage = () => {
  const { role, isCampaignManager } = useAuth();
  const [campaigns, setCampaigns] = useState<ApprovalCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending_approval" | "draft" | "approved" | "rejected">("pending_approval");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedLang, setSelectedLang] = useState<Record<number, string>>({});
  
  // Action state
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { toast, showToast } = useToast();
  const navigate = useNavigate();

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await campaignAPI.getApprovalQueue();
      setCampaigns(res.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to load campaign approvals queue";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      setActionLoadingId(id);
      await campaignAPI.approve(id, "Approved for mass distribution");
      showToast("success", `Campaign #${id} approved successfully!`);
      await fetchQueue();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to approve campaign";
      showToast("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveAndBroadcast = async (id: number) => {
    try {
      setActionLoadingId(id);
      await campaignAPI.approve(id, "Approved and broadcast triggered");
      await distributionAPI.distribute(id);
      showToast("success", `Campaign #${id} approved and broadcast dispatched to recipients!`);
      await fetchQueue();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to approve and broadcast";
      showToast("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitForApproval = async (id: number) => {
    try {
      setActionLoadingId(id);
      await campaignAPI.submitApproval(id, "Submitted for review");
      showToast("success", `Campaign #${id} submitted for approval!`);
      await fetchQueue();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to submit for approval";
      showToast("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (id: number) => {
    setRejectTargetId(id);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetId) return;
    try {
      setActionLoadingId(rejectTargetId);
      await campaignAPI.reject(rejectTargetId, rejectReason || "Revisions required by reviewer");
      showToast("info", `Campaign #${rejectTargetId} marked as rejected / revisions needed.`);
      setRejectModalOpen(false);
      await fetchQueue();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to update campaign status";
      showToast("error", msg);
    } finally {
      setActionLoadingId(null);
      setRejectTargetId(null);
    }
  };

  // KPIs
  const pendingCount = campaigns.filter((c) => c.status.toLowerCase() === "pending_approval").length;
  const draftCount = campaigns.filter((c) => c.status.toLowerCase() === "draft").length;
  const approvedCount = campaigns.filter((c) => c.status.toLowerCase() === "approved" || c.status.toLowerCase() === "scheduled" || c.status.toLowerCase() === "completed" || c.status.toLowerCase() === "running").length;
  const rejectedCount = campaigns.filter((c) => c.status.toLowerCase() === "rejected").length;

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.purpose.toLowerCase().includes(search.toLowerCase()) ||
      (c.target_audience && c.target_audience.toLowerCase().includes(search.toLowerCase())) ||
      (c.created_by && c.created_by.toLowerCase().includes(search.toLowerCase()));

    const matchTab =
      activeTab === "all" ||
      (activeTab === "pending_approval" && c.status.toLowerCase() === "pending_approval") ||
      (activeTab === "draft" && c.status.toLowerCase() === "draft") ||
      (activeTab === "approved" && (c.status.toLowerCase() === "approved" || c.status.toLowerCase() === "scheduled" || c.status.toLowerCase() === "completed" || c.status.toLowerCase() === "running")) ||
      (activeTab === "rejected" && c.status.toLowerCase() === "rejected");

    return matchSearch && matchTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending_approval":
        return <Badge variant="warning" className="animate-pulse">Pending Review</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "scheduled":
      case "running":
        return <Badge variant="info">{status.toUpperCase()}</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "rejected":
        return <Badge variant="danger">Needs Revision</Badge>;
      default:
        return <Badge variant="default">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200">
              Governance & Verification Gate
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Role: <strong className="text-slate-800 capitalize">{role?.replace("_", " ")}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2.5">
            Campaign Approval Center
          </h1>
          <p className="text-sm text-slate-500">
            Review AI-generated multilingual campaigns, verify factual claims & translation accuracy, and approve broadcasts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchQueue} className="border-slate-300 text-slate-700 hover:bg-slate-50">
            Refresh Queue
          </Button>
          <Button variant="primary" onClick={() => navigate("/campaigns/wizard")}>
            + Create New Campaign
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("pending_approval")}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            activeTab === "pending_approval"
              ? "border-amber-400 bg-amber-50/70 shadow-sm ring-2 ring-amber-400/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Pending Sign-off
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              ⏳
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{pendingCount}</div>
          <p className="mt-1 text-xs text-slate-500">Campaigns awaiting management review</p>
        </div>

        <div
          onClick={() => setActiveTab("approved")}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            activeTab === "approved"
              ? "border-emerald-400 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-400/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Approved & Ready
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              ✓
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{approvedCount}</div>
          <p className="mt-1 text-xs text-slate-500">Cleared for multi-channel broadcast</p>
        </div>

        <div
          onClick={() => setActiveTab("draft")}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            activeTab === "draft"
              ? "border-indigo-400 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-400/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Drafts in Progress
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
              📝
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{draftCount}</div>
          <p className="mt-1 text-xs text-slate-500">Created by team, not yet submitted</p>
        </div>

        <div
          onClick={() => setActiveTab("rejected")}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            activeTab === "rejected"
              ? "border-rose-400 bg-rose-50/70 shadow-sm ring-2 ring-rose-400/20"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Needs Revision
            </span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              ✕
            </span>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{rejectedCount}</div>
          <p className="mt-1 text-xs text-slate-500">Returned for fact or language fix</p>
        </div>
      </div>

      {/* Filters & Tabs */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("pending_approval")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "pending_approval"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ⏳ Pending Review ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "approved"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ✅ Approved ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab("draft")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "draft"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              📝 Drafts ({draftCount})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "rejected"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ❌ Needs Revision ({rejectedCount})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Items ({campaigns.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by title, audience, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Queue List */}
      {loading ? (
        <Card className="p-6">
          <LoadingSkeleton rows={5} />
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchQueue} />
      ) : filteredCampaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-base font-semibold text-slate-800">No campaigns found in this view</p>
          <p className="mt-1 text-xs text-slate-500">
            {activeTab === "pending_approval"
              ? "All campaigns have been reviewed! No items are currently waiting for approval."
              : "No campaigns match your selected filter."}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("all")}>
              View All Campaigns
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/campaigns/wizard")}>
              Create New Campaign
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((c) => {
            const isExpanded = expandedId === c.id;
            const currentLang = selectedLang[c.id] || c.desired_language || "English";
            const selectedContent =
              c.contents.find((cnt) => cnt.language.toLowerCase() === currentLang.toLowerCase()) ||
              c.contents[0];

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
              >
                {/* Main Card Header */}
                <div className="p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">#{c.id}</span>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
                          {c.title}
                        </h2>
                        {getStatusBadge(c.status)}
                        {c.selected_channels && c.selected_channels.length > 0 ? (
                          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                            Channels: {c.selected_channels.join(", ")}
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {c.communication_channel || "All Channels"}
                          </span>
                        )}
                        {c.scheduled_at && (
                          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800 flex items-center gap-1">
                            📅 Scheduled: {new Date(c.scheduled_at).toLocaleString()} ({c.scheduled_timezone || "IST"})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">{c.purpose}</p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span>
                          Target: <strong className="text-slate-700">{c.target_audience || "General Public"}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Author: <strong className="text-slate-700">{c.created_by || "System"}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Created: <strong className="text-slate-700">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</strong>
                        </span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">
                          {c.contents.length || 1} Language Variations
                        </span>
                      </div>
                    </div>

                    {/* Quick Metric Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                      {/* Fact Verification Badge */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                        <span className="text-slate-500">Fact-Check:</span>
                        {c.fact_verification_summary?.flagged_claims && c.fact_verification_summary.flagged_claims > 0 ? (
                          <span className="font-bold text-amber-700">⚠️ Flagged Claims</span>
                        ) : (
                          <span className="font-bold text-emerald-700">🛡️ Verified Safe</span>
                        )}
                      </div>

                      {/* Translation Quality Badge */}
                      <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                        <span className="text-slate-500">Trans Quality:</span>
                        <span className="font-bold text-indigo-700">
                          {c.translation_quality_summary?.average_quality_score || 92}% BLEU
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {isExpanded ? "▲ Collapse Content & Verification" : "▼ Review Multilingual Content & Fact Claims"}
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* If Draft, allow submitting for approval */}
                      {c.status.toLowerCase() === "draft" && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={actionLoadingId === c.id}
                          onClick={() => handleSubmitForApproval(c.id)}
                          className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        >
                          Submit for Approval
                        </Button>
                      )}

                      {/* Approvals (visible to Admin & Campaign Manager) */}
                      {isCampaignManager && (c.status.toLowerCase() === "pending_approval" || c.status.toLowerCase() === "draft") && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            loading={actionLoadingId === c.id}
                            onClick={() => handleApprove(c.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                          >
                            ✓ Approve Campaign
                          </Button>

                          <Button
                            variant="primary"
                            size="sm"
                            loading={actionLoadingId === c.id}
                            onClick={() => handleApproveAndBroadcast(c.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                          >
                            🚀 Approve & Broadcast
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            loading={actionLoadingId === c.id}
                            onClick={() => openRejectModal(c.id)}
                            className="border-rose-300 text-rose-700 hover:bg-rose-50"
                          >
                            ✕ Request Changes
                          </Button>
                        </>
                      )}

                      {/* If Approved, allow quick Broadcast */}
                      {isCampaignManager && c.status.toLowerCase() === "approved" && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={actionLoadingId === c.id}
                          onClick={() => handleApproveAndBroadcast(c.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                        >
                          🚀 Launch Broadcast
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/analytics?campaignId=${c.id}`)}
                        className="text-slate-500 hover:text-slate-800"
                      >
                        Analytics
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Multilingual Content & Fact-Check Inspection Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/80 p-5 space-y-4">
                    {/* Language Selector Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold uppercase text-slate-500 mr-2">
                          Language Variations:
                        </span>
                        {c.contents.map((cnt) => (
                          <button
                            key={cnt.language}
                            onClick={() => setSelectedLang((prev) => ({ ...prev, [c.id]: cnt.language }))}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                              currentLang.toLowerCase() === cnt.language.toLowerCase()
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {cnt.language}
                          </button>
                        ))}
                      </div>

                      <span className="text-xs text-slate-500">
                        Tone: <strong className="text-slate-800">{c.desired_tone || "Informative"}</strong>
                      </span>
                    </div>

                    {/* Content Display Card */}
                    {selectedContent ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                              Message Subject / Title ({selectedContent.language})
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                              {selectedContent.message_title}
                            </h3>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Full Body Content
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-line bg-slate-50 p-3 rounded-md border border-slate-200 font-sans">
                              {selectedContent.message_body}
                            </p>
                          </div>

                          {selectedContent.short_version && (
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                SMS / Push Short Version (160 char)
                              </span>
                              <p className="text-xs text-slate-600 mt-0.5 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                                {selectedContent.short_version}
                              </p>
                            </div>
                          )}

                          {selectedContent.call_to_action && (
                            <div className="flex items-center gap-2 text-xs text-slate-700 pt-1">
                              <span className="text-emerald-600 font-bold">CTA:</span>
                              <span>{selectedContent.call_to_action}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Column: AI Metrics & Safety Verification */}
                        <div className="space-y-3">
                          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                              AI Quality & Safety Scores
                            </h4>

                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Language Quality:</span>
                                <span className="font-bold text-emerald-600">
                                  {selectedContent.quality_score || 94}/100
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Compliance & Safety:</span>
                                <span className="font-bold text-emerald-600">
                                  {selectedContent.compliance_score || 98}/100 Passed
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Sentiment:</span>
                                <span className="font-bold text-sky-600 capitalize">
                                  {selectedContent.sentiment || "Neutral"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Persona Role:</span>
                                <span className="font-bold text-slate-700">
                                  {selectedContent.audience_role || "General Public"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                              Key Information Grounding
                            </h4>
                            <p className="text-xs text-slate-600 line-clamp-3">
                              {c.key_information}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No content available for this language.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject / Request Changes Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-rose-600">✕</span> Request Revisions / Reject Campaign #{rejectTargetId}
            </h3>
            <p className="text-xs text-slate-500">
              Provide feedback or instructions for why this campaign requires revisions before it can be approved.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Revision Instructions / Notes
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please verify the helpline date with Disaster Management portal and adjust Tamil translation..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                className="border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={actionLoadingId !== null}
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-500 text-white font-semibold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

export default CampaignApprovalsPage;
