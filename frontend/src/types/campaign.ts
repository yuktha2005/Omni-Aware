export interface Campaign {
  id: number;
  title: string;
  purpose: string;
  target_audience?: string;
  key_information: string;
  desired_language?: string;
  desired_tone?: string;
  communication_channel?: string;
  status: string; // draft, scheduled, queued, running, completed, failed, cancelled
  scheduled_at?: string | null;
  scheduled_timezone?: string;
  selected_channels?: string[];
  target_segment_id?: number | null;
  created_at?: string;
  content_count?: number;
}

export interface CampaignCreate {
  title: string;
  purpose: string;
  target_audience?: string;
  key_information: string;
  desired_language?: string;
  desired_tone?: string;
  communication_channel?: string;
  optional_instructions?: string;
}

export interface CampaignContentItem {
  db_id?: number;
  id?: number;
  language: string;
  language_code: string;
  audience_role: string;
  message_title: string;
  message_body: string;
  short_version: string;
  call_to_action?: string;
  sentiment?: string;
  sentiment_score?: number;
  detected_tone?: string;
  quality_score?: number;
  compliance_passed?: boolean;
  compliance_score?: number;
  factual_verification_status?: string;
  status?: string;
}

export interface CampaignDetail extends Campaign {
  contents: CampaignContentItem[];
}
