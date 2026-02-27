/**
 * Types for the Aroundtown GCP Demo
 * London Kensington Serviced Apartments
 */

export type PipelineStatus =
  | 'Scored'
  | 'Viewing Booked'
  | 'Viewing Complete'
  | 'Verification In Progress'
  | 'Verified'
  | 'Tenancy Signed'
  | 'Flagged'
  | 'Fell Through'
  | 'Archived'

export type RiskLevel = 'Low' | 'Medium' | 'High'

export type VerificationStatus =
  | 'Not Started'
  | 'Verifying'
  | 'Verified'
  | 'Failed'

export type ConsistencyResult = 'Match' | 'Mismatch' | 'Unverified'

export interface ConsistencyCheck {
  field: string
  source: string
  result: ConsistencyResult
  detail: string
}

export interface QualityFactor {
  name: string
  score: number
  maxScore: number
  evidence: string
}

export interface IntentEvent {
  timestamp: string
  event: string
  type: 'positive' | 'neutral' | 'negative'
}

export interface OutcomeAssessment {
  score: number
  category: 'Priority' | 'Qualified' | 'Medium' | 'Low'
  lines: Array<{
    text: string
    status: 'pass' | 'warn' | 'fail'
  }>
}

export interface ConversationMessage {
  id: string
  sender: 'ai' | 'applicant'
  content: string
  timestamp: string
}

export interface DemoConversation {
  id: string
  enquirerId: string
  enquirerName: string
  status: 'Completed' | 'Flagged' | 'In Progress'
  messages: ConversationMessage[]
  outcome: OutcomeAssessment
  startedAt: string
  completedAt: string
}

export interface DemoEnquirer {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  employer: string
  role: string
  annualIncome: number
  aiScore: number
  intentScore: number
  riskLevel: RiskLevel
  pipelineStatus: PipelineStatus
  verificationStatus: VerificationStatus
  daysInPipeline: number
  linkedUnit: string | null
  area: string
  // Enrichment data (full for 12 key profiles)
  tenantSummary?: string
  qualityBreakdown?: QualityFactor[]
  intentTimeline?: IntentEvent[]
  consistencyChecks?: ConsistencyCheck[]
  conversationId?: string
}

export interface DemoUnit {
  id: string
  name: string
  type: 'Studio' | '1 Bed' | '2 Bed'
  rentPCM: number
  availableFrom: string
  status: 'Available' | 'Occupied'
  matchedLeadIds: string[]
}

export interface DemoProperty {
  name: string
  address: string
  postcode: string
  area: string
  totalUnits: number
  occupiedUnits: number
  availableUnits: number
  avgRent: number
  occupancyRate: number
}
