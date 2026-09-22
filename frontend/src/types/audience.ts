import type { Recipient } from "./recipient";

export interface AudienceFilterRequest {
  language?: string | null;
  state?: string | null;
  city?: string | null;
  occupation?: string | null;
  organization?: string | null;
  organization_unit?: string | null;
  gender?: string | null;
  status?: string | null;
  consent_status?: string | null;
}

export interface AudiencePreviewResponse {
  matching_count: number;
  recipients: Recipient[];
}
