export interface TrustedSource {
  id: number;
  name: string;
  url: string;
  category: string;
  description?: string;
  verification_status: string;
  is_active: boolean;
  last_checked_at?: string;
}

export interface FactClaimItem {
  id?: number;
  claim_text: string;
  claim_category: string;
  status: "Supported" | "Contradicted" | "Insufficient Evidence" | "Needs Human Review" | string;
  evidence_summary?: string;
  source_name?: string;
  source_url?: string;
  confidence_score: number;
  requires_human_review: boolean;
  reviewer_decision: "Pending" | "Approved" | "Rejected" | "Overridden" | string;
  timestamp?: string;
}

export interface FactVerificationResult {
  campaign_id?: number;
  overall_status: string;
  can_auto_publish: boolean;
  total_claims: number;
  supported_count: number;
  contradicted_count: number;
  needs_review_count: number;
  insufficient_count: number;
  claims: FactClaimItem[];
}

export interface TranslationEvaluationResult {
  quality_score: number;
  status: "passed" | "warning" | "critical_error" | "needs_review" | string;
  can_auto_approve: boolean;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string;
  back_translated_text?: string;
  reasons: string[];
  issues: Array<{
    category: string;
    severity: "low" | "medium" | "high";
    message: string;
    suggestion?: string;
  }>;
  critical_errors_count: number;
  score_breakdown: {
    critical_entity_preservation: number;
    semantic_similarity: number;
    completeness_and_length: number;
    terminology_consistency: number;
    readability_and_script: number;
  };
  preservation_details: {
    total_entities_found: number;
    preserved_count: number;
    missing_count: number;
    preservation_rate: number;
    preserved_items: string[];
    missing_items: string[];
  };
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id?: number;
  order_num: number;
  question_text: string;
  options: QuizOption[];
  explanation?: string;
  correct_option_id?: string;
}

export interface PublicQuiz {
  id: number;
  campaign_id: number;
  title: string;
  description?: string;
  language: string;
  questions: QuizQuestion[];
}

export interface QuizSubmissionResult {
  quiz_id: number;
  campaign_id?: number;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  passed: boolean;
  feedback_message: string;
  question_results: Array<{
    question_id?: number;
    order_num: number;
    question_text: string;
    submitted_answer?: string;
    correct_answer: string;
    is_correct: boolean;
    explanation?: string;
  }>;
}

export interface UnderstandingAnalytics {
  campaign_id: number;
  has_data: boolean;
  total_participants: number;
  total_questions_answered: number;
  total_correct_answers: number;
  overall_understanding_rate: number;
  correct_response_percentage: number;
  incorrect_response_percentage: number;
  question_performance: Array<{
    question_id: number;
    order_num: number;
    question_text: string;
    total_attempts: number;
    correct_attempts: number;
    accuracy_rate: number;
    is_low_accuracy: boolean;
  }>;
  language_performance: Array<{
    language: string;
    participants: number;
    understanding_rate: number;
  }>;
  improvement_recommendations: Array<{
    priority: "critical" | "high" | "medium" | "success" | "info";
    title: string;
    description: string;
    action: string;
  }>;
}
