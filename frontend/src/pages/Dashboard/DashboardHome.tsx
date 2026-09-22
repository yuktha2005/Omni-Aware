import { useState, useEffect } from "react";
import { recipientAPI, segmentAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import StatsCard from "../../components/ui/StatsCard";
import Card from "../../components/ui/Card";
import ErrorState from "../../components/ui/ErrorState";
import type { RecipientsListResponse } from "../../types/recipient";
import type { Segment } from "../../types/segment";

const DashboardHome = () => {
  const [totalRecipients, setTotalRecipients] = useState<number | null>(null);
  const [activeRecipients, setActiveRecipients] = useState<number | null>(null);
  const [totalSegments, setTotalSegments] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const totalRes = await recipientAPI.list({ limit: 1 });
      const total: RecipientsListResponse = totalRes.data;
      setTotalRecipients(total.total);

      const activeRes = await recipientAPI.list({
        status: "active",
        limit: 1,
      });
      const active: RecipientsListResponse = activeRes.data;
      setActiveRecipients(active.total);

      const segRes = await segmentAPI.list();
      const segments: Segment[] = segRes.data;
      setTotalSegments(segments.length);
    } catch (err) {
      const message = "Failed to load dashboard statistics";
      setError(message);
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (error) {
    return (
      <>
        <ErrorState message={error} onRetry={fetchData} />
        <ToastManager toast={toast} />
      </>
    );
  }

  const cards = [
    {
      title: "Total Recipients",
      value: totalRecipients,
      loading,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354A9.93 9.93 0 002.25 12 9.93 9.93 0 0012 19.646 9.93 9.93 0 0021.75 12 9.93 9.93 0 0012 4.354zM12 7v6l3 3"
          />
        </svg>
      ),
    },
    {
      title: "Active Recipients",
      value: activeRecipients,
      loading,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.615 4.5A2.622 2.622 0 0110 19.5H6a2.622 2.622 0 01-2.615-2.82A2.622 2.622 0 016 14h8z"
          />
        </svg>
      ),
    },
    {
      title: "Audience Segments",
      value: totalSegments,
      loading,
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5M7 12a5 5 0 1110 0 5 5 0 01-5 5v-5zM7 12V7a5 5 0 00-10 0v5a5 5 0 005 5h2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>System Overview</h1>
        <p>Overview of your multilingual communication platform</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value ?? "-"}
            loading={card.loading}
            icon={card.icon}
            subtitle={card.value === null && !card.loading ? "Unable to load" : undefined}
          />
        ))}
      </div>

      <Card className="mb-6 overflow-hidden">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Available Modules</h2>
          <span className="status-badge border-emerald-200 bg-emerald-50 text-emerald-700">
            Live
          </span>
        </div>

        <div className="space-y-3">
          {[
            "Recipients",
            "Audience Segments",
            "Recipient Import",
            "Master Data",
            "Master Data Views",
          ].map((item, index) => (
            <div
              key={item}
              className={`flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 ${index < 4 ? "border-b-0" : ""}`}
            >
              <span className="text-sm font-medium text-slate-700">{item}</span>
              <span className="status-badge border-emerald-200 bg-emerald-50 text-emerald-700">
                Active
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5">
            <span className="text-sm text-slate-700">
              Campaigns, Templates, Content Library, Scheduling, Analytics, Settings
            </span>
            <span className="status-badge border-slate-200 bg-white text-slate-500">
              Coming Soon
            </span>
          </div>
        </div>
      </Card>

      <ToastManager toast={toast} />
    </div>
  );
};

export default DashboardHome;
