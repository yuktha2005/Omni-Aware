import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { segmentAPI, masterAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import ErrorState from "../../components/ui/ErrorState";
import type { Segment } from "../../types/segment";
import type { MasterRecord } from "../../types/master";

const AudiencePage = () => {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({});

  const fetchSegments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await segmentAPI.list();
      const segs: Segment[] = res.data;
      setSegments(segs);

      const countMap: Record<number, number> = {};
      await Promise.all(
        segs.map(async (seg) => {
          if (seg.is_active) {
            try {
              const previewRes = await segmentAPI.preview(seg.id);
              countMap[seg.id] = previewRes.data.matching_count;
            } catch {
              countMap[seg.id] = 0;
            }
          } else {
            countMap[seg.id] = 0;
          }
        })
      );
      setCounts(countMap);
    } catch (err) {
      setError("Failed to load segments");
      showToast("error", "Failed to load segments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handlePreview = (seg: Segment) => {
    navigate(`/audience/segment/${seg.id}/preview`);
  };

  if (error) {
    return (
      <>
        <ErrorState message={error} onRetry={fetchSegments} />
        <ToastManager toast={toast} />
      </>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Audience Segments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage audience segments for targeted communication
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setCreateModalOpen(true)}
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Segment
        </Button>
      </div>

      <Card>
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : segments.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            No audience segments found. Create your first segment to get
            started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Matching
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {segments.map((seg) => (
                  <tr key={seg.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <span className="text-sm font-medium text-slate-800">
                        {seg.name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">
                      {seg.description || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">
                      {seg.segment_type}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          seg.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {seg.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">
                      {seg.created_at
                        ? new Date(seg.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-slate-600">
                      {seg.is_active ? counts[seg.id] ?? "…" : 0}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handlePreview(seg)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SegmentCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchSegments}
      />

      <ToastManager toast={toast} />
    </div>
  );
};

interface SegmentCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const SegmentCreateModal = ({
  open,
  onClose,
  onCreated,
}: SegmentCreateModalProps) => {
  const { toast, showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [segmentType, setSegmentType] = useState("dynamic");
  const [rules, setRules] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [masterData, setMasterData] = useState<Record<
    string,
    MasterRecord[]
  >>({});
  const [masterLoading, setMasterLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadMasterData();
    }
  }, [open]);

  const loadMasterData = async () => {
    setMasterLoading(true);
    try {
      const res = await masterAPI.getAll();
      setMasterData(res.data);
    } catch {
      showToast("error", "Failed to load master data");
    } finally {
      setMasterLoading(false);
    }
  };

  const updateRule = (key: string, value: string) => {
    setRules((prev) => ({
      ...prev,
      ...(value ? { [key]: value } : {}),
    }));
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSegmentType("dynamic");
    setRules({});
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast("error", "Segment name is required");
      return;
    }

    if (Object.keys(rules).length === 0) {
      showToast("error", "Please add at least one rule");
      return;
    }

    setLoading(true);
    try {
      await segmentAPI.create({
        name,
        description,
        segment_type: segmentType,
        rules,
      });
      showToast("success", "Segment created successfully");
      resetForm();
      onCreated();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail || "Failed to create segment";
      showToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderSelect = (
    label: string,
    key: string,
    options: { value: string; label: string }[],
    allowManual = false
  ) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <select
        value={rules[key] || ""}
        onChange={(e) => updateRule(key, e.target.value)}
        className="block w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {allowManual && (
        <input
          type="text"
          placeholder={`Or enter ${label.toLowerCase()}`}
          value={rules[key] || ""}
          onChange={(e) => updateRule(key, e.target.value)}
          className="mt-1 block w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
      )}
    </div>
  );

  const languageOptions = (masterData.languages || []).map((l) => ({
    value: l.name,
    label: l.name + (l.code ? ` (${l.code})` : ""),
  }));

  const occupationOptions = (masterData.occupations || []).map((o) => ({
    value: o.name,
    label: o.name,
  }));

  const stateOptions = (masterData.states || []).map((s) => ({
    value: s.name,
    label: s.name,
  }));

  const orgOptions = (masterData.organizations || []).map((o) => ({
    value: o.name,
    label: o.name,
  }));

  const deptOptions = (masterData.organization_units || []).map((d) => ({
    value: d.name,
    label: d.name,
  }));

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Create Segment"
      size="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600">
            Segment Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tamil Students"
            className="mt-1 block w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            className="mt-1 block w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Segment Type
          </label>
          <select
            value={segmentType}
            onChange={(e) => setSegmentType(e.target.value)}
            className="mt-1 block w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          >
            <option value="dynamic">Dynamic</option>
            <option value="static">Static</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600">
            Rules
          </label>
          <p className="text-xs text-slate-400">
            Add filtering rules. Recipients matching all rules will be included
            in this segment.
          </p>

          {masterLoading ? (
            <LoadingSkeleton rows={3} />
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {renderSelect("Language", "language", languageOptions)}
              {renderSelect("Occupation", "occupation", occupationOptions)}
              {renderSelect("State", "state", stateOptions)}
              {renderSelect("Organization", "organization", orgOptions)}
              {renderSelect("Department", "department", deptOptions)}
              {renderSelect("City", "city", [], true)}
              {renderSelect("Status", "status", [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ])}
              {renderSelect("Consent Status", "consent_status", [
                { value: "pending", label: "Pending" },
                { value: "granted", label: "Granted" },
                { value: "revoked", label: "Revoked" },
              ])}
              {renderSelect("Gender", "gender", [
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ])}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} loading={loading}>
            Create Segment
          </Button>
        </div>
      </div>

      <ToastManager toast={toast} />
    </Modal>
  );
};

export default AudiencePage;
