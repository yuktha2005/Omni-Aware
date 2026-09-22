export interface Recipient {
  id: number;
  external_reference_id: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  gender?: string | null;
  city?: string | null;
  status?: string | null;
  consent_status?: string | null;
}

export interface RecipientsListResponse {
  total: number;
  skip: number;
  limit: number;
  recipients: Recipient[];
}
