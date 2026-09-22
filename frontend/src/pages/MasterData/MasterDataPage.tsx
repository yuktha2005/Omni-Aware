import { useState, useEffect } from "react";
import { masterAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import Card from "../../components/ui/Card";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import ErrorState from "../../components/ui/ErrorState";
import type { MasterRecord } from "../../types/master";

type TabName =
  | "languages"
  | "states"
  | "occupations"
  | "organizations"
  | "organization_units";

const tabs: { id: TabName; label: string }[] = [
  { id: "languages", label: "Languages" },
  { id: "states", label: "States" },
  { id: "occupations", label: "Occupations" },
  { id: "organizations", label: "Organizations" },
  { id: "organization_units", label: "Departments" },
];

const MasterDataPage = () => {
  const { toast, showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabName>("languages");
  const [data, setData] = useState<Record<TabName, MasterRecord[]>>({
    languages: [],
    states: [],
    occupations: [],
    organizations: [],
    organization_units: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await masterAPI.getAll();
      setData({
        languages: res.data.languages,
        states: res.data.states,
        occupations: res.data.occupations,
        organizations: res.data.organizations,
        organization_units: res.data.organization_units,
      });
    } catch (err) {
      setError("Failed to load master data");
      showToast("error", "Failed to load master data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const getColumns = (tab: TabName): string[] => {
    switch (tab) {
      case "languages":
        return ["Name", "Code", "Native Name", "Active"];
      case "states":
        return ["Name", "Code", "Active"];
      case "occupations":
        return ["Name", "Description", "Active"];
      case "organizations":
        return ["Name", "Code", "Description", "Active"];
      case "organization_units":
        return ["Name", "Code", "Organization ID", "Active"];
      default:
        return ["Name"];
    }
  };

  const renderCell = (record: MasterRecord, col: string): string => {
    switch (col) {
      case "Name":
        return record.name || "—";
      case "Code":
        return record.code || "—";
      case "Native Name":
        return record.native_name || "—";
      case "Description":
        return record.description || "—";
      case "Active":
        return record.is_active ? "Yes" : "No";
      case "Organization ID":
        return record.organization_id ? String(record.organization_id) : "—";
      default:
        return String(record[col.toLowerCase() as keyof MasterRecord] ?? "—");
    }
  };

  if (error) {
    return (
      <>
        <ErrorState message={error} onRetry={fetchAll} />
        <ToastManager toast={toast} />
      </>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-slate-800">
        Master Data
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        View and manage reference data used across the platform.
      </p>

      <Card padding="none" className="mb-6">
        <div className="flex flex-wrap gap-1 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary-600 text-primary-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {loading ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <MasterDataTable
              tab={activeTab}
              records={data[activeTab] || []}
              columns={getColumns(activeTab)}
              renderCell={renderCell}
            />
          )}
        </div>
      </Card>

      <ToastManager toast={toast} />
    </div>
  );
};

interface MasterDataTableProps {
  tab: TabName;
  records: MasterRecord[];
  columns: string[];
  renderCell: (record: MasterRecord, col: string) => string;
}

const MasterDataTable = ({
  records,
  columns,
  renderCell,
}: MasterDataTableProps) => {
  if (records.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No records found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              ID
            </th>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="px-4 py-2 text-sm text-slate-600">
                {record.id}
              </td>
              {columns.map((col) => (
                <td key={col} className="px-4 py-2 text-sm text-slate-600">
                  {renderCell(record, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MasterDataPage;
