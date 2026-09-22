import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { segmentAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import Card from "../../components/ui/Card";
import ErrorState from "../../components/ui/ErrorState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import type { Segment, SegmentPreviewResponse } from "../../types/segment";

const SegmentPreviewPage = () => {
  const { segmentId } = useParams<{ segmentId: string }>();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [segment, setSegment] = useState<Segment | null>(null);
  const [preview, setPreview] = useState<SegmentPreviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSegment = async () => {
    if (!segmentId) return;
    try {
      setLoading(true);
      setError("");
      const segRes = await segmentAPI.get(parseInt(segmentId));
      setSegment(segRes.data);

      const previewRes = await segmentAPI.preview(parseInt(segmentId));
      setPreview(previewRes.data);
    } catch (err) {
      setError("Failed to load segment");
      showToast("error", "Failed to load segment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegment();
  }, [segmentId]);

  const ruleLabels: Record<string, string> = {
    language: "Language",
    occupation: "Occupation",
    state: "State",
    organization: "Organization",
    department: "Department",
    city: "City",
    status: "Status",
    consent_status: "Consent Status",
    gender: "Gender",
  };

  if (loading) {
    return (
      <>
        <LoadingSkeleton rows={10} />
        <ToastManager toast={toast} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <ErrorState message={error} onRetry={fetchSegment} />
        <ToastManager toast={toast} />
      </>
    );
  }

  if (!segment) return null;

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
        Back to Audience
      </button>

      <Card className="mb-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {segment.name}
          </h2>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              segment.is_active
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {segment.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {segment.description && (
          <p className="mb-4 text-sm text-slate-600">{segment.description}</p>
        )}

        <div className="mb-2 text-sm font-medium text-slate-700">
          Segment Type: {segment.segment_type}
        </div>

        {segment.rules && Object.keys(segment.rules).length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-medium text-slate-700">Rules</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(segment.rules).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {ruleLabels[key] || key}
                  </span>
                  <span className="text-slate-500">:</span>
                  <span className="text-slate-800">{String(value)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-sm font-medium text-slate-600">
            Matching Recipients:
          </span>
          <span className="ml-2 text-xl font-bold text-primary-700">
            {preview?.matching_count ?? 0}
          </span>
        </div>
      </Card>

      {preview && (
        <Card>
          <h3 className="mb-3 text-sm font-medium text-slate-700">
            Matching Recipients ({preview.matching_count})
          </h3>
          {preview.recipients.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">
              No recipients match this segment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      External Ref ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {preview.recipients.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        {r.id}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        {r.external_reference_id || "—"}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-800">
                        {r.first_name} {r.last_name}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        {r.email || "—"}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        {r.phone_number || "—"}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        {r.city || "—"}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">
                        {r.status || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

export default SegmentPreviewPage;
