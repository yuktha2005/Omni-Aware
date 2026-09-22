export interface ScheduleCampaignRequest {
  scheduled_at?: string | null;
  scheduled_timezone?: string;
  target_segment_id?: number | null;
  selected_channels: string[];
  content_id?: number | null;
}

export interface DispatchResponse {
  campaign_id: number;
  status: string;
  total_eligible: number;
  channels_queued: string[];
  message: string;
}

export interface DeliveryItem {
  id: number;
  campaign_id: number;
  recipient_id: number;
  channel: string;
  message_id?: string | null;
  status: string;
  provider: string;
  attempt_count: number;
  retry_count: number;
  sent_at?: string | null;
  delivered_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  created_at?: string | null;
}

export interface DeliveryListResponse {
  total: number;
  skip: number;
  limit: number;
  deliveries: DeliveryItem[];
}

export interface CampaignMonitoringData {
  campaign_id: number;
  title: string;
  status: string;
  progress_percent: number;
  metrics: {
    total: number;
    queued: number;
    sending: number;
    sent: number;
    delivered: number;
    retrying: number;
    failed: number;
    cancelled: number;
  };
  channels: string[];
  recent_failures: Array<{
    id: number;
    recipient_id: number;
    channel: string;
    failure_reason: string;
    attempt_count: number;
    retry_count: number;
    status: string;
  }>;
}

export interface WebBroadcast {
  id: number;
  campaign_id: number;
  title: string;
  body: string;
  language: string;
  call_to_action?: string;
  is_active: boolean;
  views_count: number;
  created_at?: string;
}
