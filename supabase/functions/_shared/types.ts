/**
 * Naybourhood Scoring API - Type Definitions
 *
 * These types define the API request/response contracts for the universal scoring API.
 */

// ═══════════════════════════════════════════════════════════════════
// REQUEST TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ScoreRequest {
  external_id: string;
  external_source?: string;
  buyer?: BuyerInput;
  requirements?: RequirementsInput;
  financial?: FinancialInput;
  context?: ContextInput;
}

export interface BuyerInput {
  country?: string;
  region?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface RequirementsInput {
  budget_min?: number;
  budget_max?: number;
  bedrooms?: number;
  preferred_location?: string;
  purchase_purpose?: string;
  timeline?: string;
}

export interface FinancialInput {
  payment_method?: string;
  connect_to_broker?: boolean;
  buying_within_28_days?: boolean;
  proof_of_funds?: boolean;
  mortgage_status?: string;
}

export interface ContextInput {
  development_id?: string;
  development_name?: string;
  channel?: string;
  source_campaign?: string;
}

export interface BatchScoreRequest {
  leads: ScoreRequest[];
}

export interface OutcomeRequest {
  external_id: string;
  external_source?: string;
  status: 'converted' | 'lost' | 'disqualified' | 'stale';
  reason?: string;
  value?: number;
}

// ═══════════════════════════════════════════════════════════════════
// RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ScoreResponse {
  id: string;
  external_id: string;
  scores: {
    quality_score: number;
    intent_score: number;
    confidence_score: number;
  };
  classification: Classification;
  priority: Priority;
  risk_flags: string[];
  next_action: string;
  summary: string;
  model_version: string;
  scored_at: string;
}

export interface BatchScoreResponse {
  results: ScoreResponse[];
  processed: number;
  errors: BatchError[];
}

export interface BatchError {
  external_id: string;
  error: string;
}

export interface OutcomeResponse {
  success: boolean;
  id: string;
  external_id: string;
  days_to_outcome: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
}

export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// ENUMS & CONSTANTS
// ═══════════════════════════════════════════════════════════════════

export type Classification =
  | 'hot_lead'
  | 'qualified'
  | 'needs_qualification'
  | 'nurture'
  | 'low_priority'
  | 'disqualified';

export type Priority = 'high' | 'medium' | 'low' | 'none';

export type OutcomeStatus = 'converted' | 'lost' | 'disqualified' | 'stale';

export type ErrorCode =
  | 'INVALID_API_KEY'
  | 'MISSING_EXTERNAL_ID'
  | 'LEAD_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'BATCH_TOO_LARGE'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR';

// ═══════════════════════════════════════════════════════════════════
// INTERNAL TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AuthResult {
  valid: boolean;
  customer_id?: string;
  customer_name?: string;
  tier?: string;
  rate_limit?: number;
  error?: ErrorCode;
}

export interface ScoredLeadRow {
  id: string;
  customer_id: string;
  external_id: string;
  external_source: string;
  buyer_country: string | null;
  buyer_region: string | null;
  budget_min: number | null;
  budget_max: number | null;
  bedrooms: number | null;
  preferred_location: string | null;
  purchase_purpose: string | null;
  timeline: string | null;
  payment_method: string | null;
  connect_to_broker: boolean | null;
  buying_within_28_days: boolean | null;
  development_id: string | null;
  development_name: string | null;
  channel: string | null;
  source_campaign: string | null;
  input_payload: Record<string, unknown> | null;
  quality_score: number;
  intent_score: number;
  confidence_score: number;
  classification: Classification;
  priority: Priority;
  risk_flags: string[];
  next_action: string;
  summary: string;
  model_version: string;
  score_time_ms: number;
  scored_at: string;
  outcome_status: OutcomeStatus | null;
  outcome_reason: string | null;
  outcome_value: number | null;
  outcome_at: string | null;
  days_to_outcome: number | null;
  created_at: string;
  updated_at: string;
}

export interface ScoreBreakdown {
  factor: string;
  points: number;
  reason: string;
}

export interface QualityResult {
  total: number;
  breakdown: ScoreBreakdown[];
  isDisqualified: boolean;
  disqualificationReason?: string;
}

export interface IntentResult {
  total: number;
  breakdown: ScoreBreakdown[];
  is28DayBuyer: boolean;
}

export interface ConfidenceResult {
  total: number;
  breakdown: ScoreBreakdown[];
}

export interface ScoringResult {
  quality: QualityResult;
  intent: IntentResult;
  confidence: ConfidenceResult;
  classification: Classification;
  priority: Priority;
  riskFlags: string[];
  nextAction: string;
  summary: string;
}

// ═══════════════════════════════════════════════════════════════════
// API VERSION
// ═══════════════════════════════════════════════════════════════════

export const API_VERSION = '1.0';
export const MODEL_VERSION = '1.0';
export const MAX_BATCH_SIZE = 100;
