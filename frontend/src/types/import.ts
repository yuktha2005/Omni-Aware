export interface ImportPreviewColumnValidation {
  valid: boolean;
  missing_columns: string[];
  columns: string[];
}

export interface ImportError {
  row: number;
  field?: string;
  error: string;
}

export interface FilePreviewRow {
  [key: string]: unknown;
}

export interface ImportPreviewResponse {
  valid: boolean;
  filename: string;
  total_rows: number;
  columns?: string[];
  error_count?: number;
  errors?: ImportError[];
  preview?: FilePreviewRow[];
  validation?: ImportPreviewColumnValidation;
}

export interface ImportErrorItem {
  row: number;
  external_reference_id?: string;
  email?: string;
  reason?: string;
  error?: string;
}

export interface ImportResultResponse {
  success: boolean;
  message: string;
  total_rows: number;
  imported_count: number;
  duplicate_count: number;
  duplicates: ImportErrorItem[];
  error_count?: number;
  errors?: ImportErrorItem[];
}
