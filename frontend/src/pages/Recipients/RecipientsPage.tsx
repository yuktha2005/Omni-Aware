import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { recipientAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ErrorState from "../../components/ui/ErrorState";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import type { RecipientsListResponse, Recipient } from "../../types/recipient";

const RecipientsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [data, setData] = useState<RecipientsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const city = searchParams.get("city") || "";
  const skip = parseInt(searchParams.get("skip") || "0");
  const limit = parseInt(searchParams.get("limit") || "50");

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      setError("");
      const params: Record<string, string | number> = { skip, limit };
      if (search) params.search = search;
      if (status) params.status = status;
      if (city) params.city = city;

      const res = await recipientAPI.list(params);
      setData(res.data);
    } catch (err) {
      setError("Failed to load recipients");
      showToast("error", "Failed to load recipients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
  }, [search, status, city, skip, limit]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("skip", "0");
    setSearchParams(newParams);
  };

  const handleView = (id: number) => {
    navigate(`/recipients/${id}`);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;
  const currentPage = data ? Math.floor(data.skip / data.limit) + 1 : 1;

  const goToPage = (page: number) => {
    const newSkip = (page - 1) * limit;
    searchParams.set("skip", String(newSkip));
    setSearchParams(searchParams);
  };

  return (
    <div>
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 tracking-tight">
              Verified Recipient Directory
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {data ? `${data.total.toLocaleString()} registered citizen records` : "Query and filter registry"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecipients}
            >
              Refresh List
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/import")}
            >
              + Ingest Data
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Search Directory
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => updateParam("search", e.target.value)}
              placeholder="Search by name, email, phone number, or external ID..."
              className="field-input mt-0"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => updateParam("status", e.target.value)}
              className="field-input mt-0"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Filter City / District
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => updateParam("city", e.target.value)}
              placeholder="e.g. Mumbai, Delhi"
              className="field-input mt-0"
            />
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRecipients} />
        ) : !data || data.recipients.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No recipients found. Try adjusting your search or filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="classic-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ref ID</th>
                    <th>Citizen Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Consent</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recipients.map((r: Recipient) => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs text-slate-500">{r.id}</td>
                      <td className="font-mono text-xs text-slate-500">{r.external_reference_id || "—"}</td>
                      <td className="font-semibold text-slate-900">
                        {r.first_name} {r.last_name}
                      </td>
                      <td className="text-slate-600">{r.email || "—"}</td>
                      <td className="font-mono text-xs text-slate-600">{r.phone_number || "—"}</td>
                      <td className="capitalize text-slate-600">{r.gender || "—"}</td>
                      <td className="text-slate-700">{r.city || "—"}</td>
                      <td>
                        <Badge
                          variant={r.status === "active" ? "success" : "neutral"}
                          size="sm"
                        >
                          <span className="capitalize">{r.status || "Unknown"}</span>
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          variant={
                            r.consent_status === "granted"
                              ? "info"
                              : r.consent_status === "revoked"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          <span className="capitalize">{r.consent_status || "Pending"}</span>
                        </Badge>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(r.id)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Inspect →
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing {(data.skip || 0) + 1} to{" "}
                  {Math.min(
                    (data.skip || 0) + (data.recipients?.length || 0),
                    data.total
                  )}{" "}
                  of {data.total} results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      <ToastManager toast={toast} />
    </div>
  );
};

export default RecipientsPage;
