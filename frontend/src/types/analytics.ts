export interface MetricSummary {
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  total_opened: number;
  open_rate: number | string;
  total_clicked: number;
  click_rate: number | string;
  total_responded: number;
  response_rate: number;
  total_participated: number;
  participation_rate: number;
}

export interface ChannelMetric {
  channel: string;
  sent: number;
  delivered: number;
  failed: number;
  delivery_rate: number;
  opened: number;
  open_rate: number | string;
  clicked: number;
  click_rate: number | string;
  responded: number;
  response_rate: number;
}

export interface LanguageMetric {
  language: string;
  language_code: string;
  recipient_count: number;
  sent: number;
  delivered: number;
  delivery_rate: number;
  engagement_count: number;
  engagement_rate: number;
}

export interface AudienceMetric {
  segment_name: string;
  recipient_count: number;
  sent: number;
  delivered: number;
  delivery_rate: number;
  engagement_count: number;
  engagement_rate: number;
}

export interface FeedbackSummary {
  total_feedbacks: number;
  average_rating?: number | null;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  positive_percentage: number;
  neutral_percentage: number;
  negative_percentage: number;
  top_tones: Record<string, number>;
}

export interface CampaignAnalytics {
  campaign_id: number;
  campaign_title: string;
  purpose: string;
  status: string;
  created_at?: string | null;
  scheduled_at?: string | null;
  summary: MetricSummary;
  channels: ChannelMetric[];
  languages: LanguageMetric[];
  audiences: AudienceMetric[];
  feedback: FeedbackSummary;
}

export interface PlatformOverview {
  total_campaigns: number;
  active_campaigns: number;
  completed_campaigns: number;
  total_dispatches: number;
  total_delivered: number;
  overall_delivery_rate: number;
  total_engagements: number;
  overall_engagement_rate: number;
  channel_distribution: Record<string, number>;
  language_distribution: Record<string, number>;
}

export interface FeedbackItem {
  id: number;
  recipient_id?: number | null;
  channel?: string | null;
  feedback_text: string;
  rating?: number | null;
  sentiment: string;
  sentiment_score: number;
  detected_tone: string;
  created_at?: string | null;
}
