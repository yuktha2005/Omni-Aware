export interface SegmentRule {
  [key: string]: string;
}

export interface Segment {
  id: number;
  name: string;
  description: string | null;
  segment_type: string;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  rules: SegmentRule;
}

export interface SegmentCreate {
  name: string;
  description?: string | null;
  segment_type: string;
  rules: SegmentRule;
}

export interface SegmentCreateResponse {
  message: string;
  segment: {
    id: number;
    name: string;
    description: string | null;
    segment_type: string;
    is_active: boolean;
  };
}

export interface SegmentPreviewResponse {
  segment_id: number;
  segment_name: string;
  matching_count: number;
  recipients: Array<{
    id: number;
    external_reference_id: string;
    first_name: string;
    last_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    city?: string | null;
    status?: string | null;
    consent_status?: string | null;
  }>;
}
