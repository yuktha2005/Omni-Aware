import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recipientAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import Card from "../../components/ui/Card";
import ErrorState from "../../components/ui/ErrorState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import type { Recipient } from "../../types/recipient";

const RecipientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRecipient = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await recipientAPI.get(parseInt(id));
      setRecipient(res.data);
    } catch (err) {
      setError("Failed to load recipient details");
      showToast("error", "Failed to load recipient details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipient();
  }, [id]);

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        <svg
          className="mr-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Recipients
      </button>

      {loading ? (
        <Card>
          <LoadingSkeleton rows={8} />
        </Card>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRecipient} />
      ) : recipient ? (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-800">
            Recipient Details
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Recipient ID
              </label>
              <p className="text-sm text-slate-800">{recipient.id}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                External Reference ID
              </label>
              <p className="text-sm text-slate-800">
                {recipient.external_reference_id || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Full Name
              </label>
              <p className="text-sm text-slate-800">
                {recipient.first_name} {recipient.last_name}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Email
              </label>
              <p className="text-sm text-slate-800">
                {recipient.email || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Phone Number
              </label>
              <p className="text-sm text-slate-800">
                {recipient.phone_number || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Gender
              </label>
              <p className="text-sm text-slate-800">
                {recipient.gender || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                City
              </label>
              <p className="text-sm text-slate-800">
                {recipient.city || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Status
              </label>
              <p className="text-sm text-slate-800">
                {recipient.status || "—"}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Consent Status
              </label>
              <p className="text-sm text-slate-800">
                {recipient.consent_status || "—"}
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Note: Language, State, Occupation, Organization, and Department
            are stored as foreign key references and are resolved through
            the Master Data module. They are displayed on the Master Data
            page.
          </p>
        </Card>
      ) : null}

      <ToastManager toast={toast} />
    </div>
  );
};

export default RecipientDetailPage;
