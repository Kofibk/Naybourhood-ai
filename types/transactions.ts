// Transaction pipeline types for buyer outcome tracking

export const TRANSACTION_STAGES = [
  'enquiry',
  'viewing',
  'offer',
  'reservation',
  'exchange',
  'completion',
] as const

export type TransactionStage =
  | 'enquiry'
  | 'viewing'
  | 'offer'
  | 'reservation'
  | 'exchange'
  | 'completion'
  | 'fallen_through'

export const STAGE_LABELS: Record<TransactionStage, string> = {
  enquiry: 'Enquiry',
  viewing: 'Viewing',
  offer: 'Offer',
  reservation: 'Reservation',
  exchange: 'Exchange',
  completion: 'Completion',
  fallen_through: 'Fallen Through',
}

export type FallThroughReason =
  | 'changed_mind'
  | 'finance_failed'
  | 'found_elsewhere'
  | 'chain_broke'
  | 'other'

export const FALL_THROUGH_LABELS: Record<FallThroughReason, string> = {
  changed_mind: 'Changed Mind',
  finance_failed: 'Finance Failed',
  found_elsewhere: 'Found Elsewhere',
  chain_broke: 'Chain Broke',
  other: 'Other',
}

export interface StageHistoryEntry {
  stage: TransactionStage
  timestamp: string
  notes?: string
  updated_by?: string
}

export interface BuyerTransaction {
  id: string
  buyer_id: string
  development_id: string | null
  company_id: string | null
  current_stage: TransactionStage
  stage_history: StageHistoryEntry[]
  fall_through_reason: FallThroughReason | null
  fall_through_stage: string | null
  created_at: string
  updated_at: string
}

export interface ScoringOutcome {
  id: string
  buyer_id: string
  company_id: string | null
  original_quality_score: number | null
  original_intent_score: number | null
  original_confidence: number | null
  actual_outcome: 'completion' | 'fallen_through'
  stage_reached: string
  created_at: string
}

// Analytics types
export interface FunnelStage {
  stage: string
  count: number
  color: string
}

export interface FallThroughByStage {
  stage: string
  count: number
  rate: number
}

export interface FallThroughReasonStat {
  reason: string
  label: string
  count: number
  percentage: number
}

export interface AvgDaysPerStage {
  stage: string
  avg_days: number
}

export interface OutcomeAnalyticsData {
  funnel: FunnelStage[]
  fallThroughByStage: FallThroughByStage[]
  avgDaysPerStage: AvgDaysPerStage[]
  topFallThroughReasons: FallThroughReasonStat[]
  totalTransactions: number
  completionRate: number
  fallThroughRate: number
}
