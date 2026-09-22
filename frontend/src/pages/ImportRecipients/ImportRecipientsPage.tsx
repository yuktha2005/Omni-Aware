import { useState, useCallback } from "react";
import { importAPI } from "../../services/apiService";
import { ToastManager } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import type {
  ImportPreviewResponse,
  ImportResultResponse,
  FilePreviewRow,
  ImportError,
} from "../../types/import";

type ImportStep = "upload" | "preview" | "confirm" | "result";

const ImportRecipientsPage = () => {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(
    null
  );
  const [resultData, setResultData] = useState<ImportResultResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();

  const reset = () => {
    setStep("upload");
    setFile(null);
    setPreviewData(null);
    setResultData(null);
  };

  const handleFileChange = useCallback(
    async (selectedFile: File | null) => {
      if (!selectedFile) return;

      const ext = selectedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx") {
        showToast("error", "Only CSV and XLSX files are supported");
        return;
      }

      setFile(selectedFile);
      setLoading(true);

      try {
        const res = await importAPI.preview(selectedFile);
        setPreviewData(res.data);
        setStep("preview");
        if (res.data.valid) {
          showToast("success", "File uploaded and validated successfully");
        } else if (res.data.validation && !res.data.validation.valid) {
          showToast("warning", "Some required columns are missing");
        } else if ((res.data.error_count || 0) > 0) {
          showToast(
            "warning",
            `${res.data.error_count} validation errors found in file`
          );
        } else {
          showToast("success", "File uploaded successfully");
        }
      } catch (err) {
        setFile(null);
        showToast("error", "Failed to upload and preview file");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const handleConfirmImport = async () => {
    if (!file) {
      showToast("error", "No file selected");
      return;
    }

    setStep("confirm");
    setLoading(true);

    try {
      const res = await importAPI.import(file);
      setResultData(res.data);
      setStep("result");

      if (res.data.success) {
        showToast(
          "success",
          `${res.data.imported_count} recipients imported successfully`
        );
      } else {
        showToast("warning", res.data.message);
      }
    } catch (err) {
      setResultData({
        success: false,
        message: "Import failed. Please try again.",
        total_rows: 0,
        imported_count: 0,
        duplicate_count: 0,
        duplicates: [],
      } as ImportResultResponse);
      setStep("result");
      showToast("error", "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === "upload" && (
        <UploadStep
          onFileSelect={handleFileChange}
          loading={loading}
        />
      )}

      {step === "preview" && previewData && (
        <PreviewStep
          data={previewData}
          onBack={reset}
          onConfirm={handleConfirmImport}
          importing={loading}
        />
      )}

      {step === "confirm" && (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-8 w-8 animate-spin text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-sm text-slate-600">Importing recipients...</p>
          </div>
        </div>
      )}

      {step === "result" && resultData && (
        <ResultStep data={resultData} onReset={reset} />
      )}

      <ToastManager toast={toast} />
    </div>
  );
};

interface UploadStepProps {
  onFileSelect: (file: File | null) => void;
  loading: boolean;
}

const UploadStep = ({ onFileSelect, loading }: UploadStepProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileSelect(e.dataTransfer.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Import Recipients
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Upload a CSV or XLSX file containing recipient data. The file will be
        validated before importing.
      </p>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-primary-500 bg-primary-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg
          className="mx-auto mb-4 h-8 w-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V8m0 0V8a4 4 0 118 0v8m-4 4h.01M12 12V8"
          />
        </svg>
        <p className="mb-2 text-sm text-slate-600">
          {dragActive
            ? "Drop your file here"
            : "Drag and drop your file here, or use the file selector"}
        </p>
        <p className="mb-4 text-xs text-slate-400">
          Supported formats: CSV, XLSX
        </p>
        <label className="inline-block cursor-pointer rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
          Choose File
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {loading && (
        <div className="mt-4 text-center text-sm text-slate-500">
          Processing file...
        </div>
      )}
    </Card>
  );
};

interface PreviewStepProps {
  data: ImportPreviewResponse;
  onBack: () => void;
  onConfirm: () => void;
  importing: boolean;
}

const PreviewStep = ({
  data,
  onBack,
  onConfirm,
  importing,
}: PreviewStepProps) => {
  const validRows = data.total_rows - (data.error_count || 0);
  const showErrors = !data.valid && (data.error_count || 0) > 0;
  const hasColumnError = data.validation && !data.validation.valid;

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">
          Import Preview
        </h2>
        <span className="text-sm text-slate-500">File: {data.filename}</span>
      </div>

      {hasColumnError && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <h3 className="mb-2 text-sm font-medium text-red-800">
            Missing Required Columns
          </h3>
          <ul className="list-disc list-inside text-sm text-red-700">
            {data.validation!.missing_columns.map((col) => (
              <li key={col}>{col}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Total Rows</p>
          <p className="text-xl font-bold text-slate-800">
            {data.total_rows}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Valid Rows</p>
          <p className="text-xl font-bold text-green-700">
            {validRows}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Invalid Rows</p>
          <p className="text-xl font-bold text-amber-700">
            {data.error_count || 0}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Columns</p>
          <p className="text-xl font-bold text-slate-800">
            {data.columns?.length || 0}
          </p>
        </div>
      </div>

      {data.preview && data.preview.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-slate-700">
            Preview (first {data.preview.length} rows)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  {data.columns?.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.preview.map((row: FilePreviewRow, idx: number) => (
                  <tr key={idx}>
                    {data.columns?.map((col) => (
                      <td
                        key={`${idx}-${col}`}
                        className="px-3 py-1.5 text-slate-600"
                      >
                        {row[col] !== undefined && row[col] !== null
                          ? String(row[col])
                          : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showErrors && data.errors && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-red-800">
            Validation Errors ({data.errors.length})
          </h3>
          <div className="max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">
                    Row
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">
                    Field
                  </th>
                  <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.errors.map((err: ImportError, idx: number) => (
                  <tr key={idx}>
                    <td className="px-3 py-1.5 text-slate-600">{err.row}</td>
                    <td className="px-3 py-1.5 text-slate-600">
                      {err.field || "—"}
                    </td>
                    <td className="px-3 py-1.5 text-red-600">
                      {err.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <Button variant="secondary" onClick={onBack} disabled={importing}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={importing || !data.valid}
        >
          {importing ? "Importing..." : "Confirm Import"}
        </Button>
      </div>

      {!data.valid && (
        <p className="mt-2 text-xs text-amber-600">
          Import cannot proceed due to validation errors. Please fix the file
          and try again.
        </p>
      )}
    </Card>
  );
};

interface ResultStepProps {
  data: ImportResultResponse;
  onReset: () => void;
}

const ResultStep = ({ data, onReset }: ResultStepProps) => {
  return (
    <Card>
      <div className="mb-6 flex items-center gap-3">
        <div
          className={`rounded-full p-2 ${
            data.success
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {data.success ? (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          {data.success ? "Import Completed" : "Import Result"}
        </h2>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Total Rows</p>
          <p className="text-xl font-bold text-slate-800">
            {data.total_rows}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Imported</p>
          <p className="text-xl font-bold text-green-700">
            {data.imported_count}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Duplicates</p>
          <p className="text-xl font-bold text-amber-700">
            {data.duplicate_count}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Errors</p>
          <p className="text-xl font-bold text-red-700">
            {data.error_count || 0}
          </p>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600">{data.message}</p>

      {data.imported_count === 0 && data.error_count && data.error_count > 0 && data.errors && (
        <div className="mb-4 max-h-48 overflow-y-auto">
          <h3 className="mb-2 text-sm font-medium text-red-800">
            Import Errors ({data.errors.length})
          </h3>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">
                  Row
                </th>
                <th className="px-3 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.errors.map((err, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-1.5 text-slate-600">
                    {err.row || "—"}
                  </td>
                  <td className="px-3 py-1.5 text-red-600">
                    {err.error}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button variant="secondary" onClick={onReset}>
        Import Another File
      </Button>
    </Card>
  );
};

export default ImportRecipientsPage;
