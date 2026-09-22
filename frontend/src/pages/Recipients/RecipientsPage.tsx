import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { recipientAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import Card from "../../components/ui/Card";
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
            <h2 className="text-lg font-semibold text-slate-800">
              Recipient Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {data ? `${data.total} recipients found` : "Search and filter"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => updateParam("search", e.target.value)}
              placeholder="Name, email, phone, or external ID"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="sm:w-36">
            <label className="block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => updateParam("status", e.target.value)}
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="sm:w-36">
            <label className="block text-xs font-medium text-slate-600">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => updateParam("city", e.target.value)}
              placeholder="e.g. Chennai"
              className="mt-1 block w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      External Ref ID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Consent
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.recipients.map((r: Recipient) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm text-slate-600">
                        {r.id}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">
                        {r.external_reference_id || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-medium text-slate-800">
                        {r.first_name} {r.last_name}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">
                        {r.email || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">
                        {r.phone_number || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">
                        {r.gender || "-"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">
                        {r.city || "-"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.status || "unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.consent_status === "granted"
                              ? "bg-blue-100 text-blue-700"
                              : r.consent_status === "revoked"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {r.consent_status || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleView(r.id)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          View
                        </button>
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
