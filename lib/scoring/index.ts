/**
 * Lead Scoring System v2.0
 *
 * Improved scoring that:
 * - Weighs budget/financial potential heavily (strong buying signal)
 * - Doesn't penalise new leads for missing verification steps
 * - Classifies based on potential, not just current engagement
 * - Gives benefit of doubt to fresh leads with good profiles
 *
 * Scores:
 * - Lead Score (0-100): Combined score for display
 * - Quality Score (0-100): Profile + Financial potential
 * - Intent Score (0-100): Timeline + Engagement + Commitment
 * - Confidence Score (0-10): Data completeness
 */

import type { Buyer } from '@/types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ScoreBreakdown {
  category: string
  score: number
  maxScore: number
  details: string[]
}

export interface QualityScoreResult {
  total: number
  breakdown: {
    profileCompleteness: ScoreBreakdown
    financialQualification: ScoreBreakdown
    verificationStatus: ScoreBreakdown
    inventoryFit: ScoreBreakdown
  }
}

export interface IntentScoreResult {
  total: number
  breakdown: {
    timeline: ScoreBreakdown
    purpose: ScoreBreakdown
    engagement: ScoreBreakdown
    commitment: ScoreBreakdown
    negativeModifiers: ScoreBreakdown
  }
}

export interface ConfidenceScoreResult {
  total: number  // 0-10 scale
  breakdown: {
    dataCompleteness: ScoreBreakdown
    verificationLevel: ScoreBreakdown
    engagementData: ScoreBreakdown
    transcriptQuality: ScoreBreakdown
  }
}

export type Classification =
  | 'Hot'
  | 'Warm-Qualified'
  | 'Warm-Engaged'
  | 'Nurture-Premium'
  | 'Nurture-Standard'
  | 'Cold'
  | 'Disqualified'
  | 'Spam'

export type Priority = 'P1' | 'P2' | 'P3' | 'P4'

export interface PriorityInfo {
  priority: Priority
  responseTime: string
  description: string
}

export interface SpamCheckResult {
  isSpam: boolean
  flags: string[]
  confidence: number
}

export interface LeadScoreResult {
  spamCheck: SpamCheckResult
  qualityScore: QualityScoreResult
  intentScore: IntentScoreResult
  confidenceScore: ConfidenceScoreResult
  classification: Classification
  priority: PriorityInfo
  riskFlags: string[]
}

// ═══════════════════════════════════════════════════════════════════
// BUDGET TIERS - Key signal for lead quality
// ═══════════════════════════════════════════════════════════════════

interface BudgetTier {
  min: number
  label: string
  qualityBoost: number      // Added to quality score
  classificationFloor: Classification  // Minimum classification for new leads
}

const BUDGET_TIERS: BudgetTier[] = [
  { min: 2000000, label: 'Ultra Premium (£2M+)', qualityBoost: 35, classificationFloor: 'Warm-Qualified' },
  { min: 1000000, label: 'Premium (£1M+)', qualityBoost: 30, classificationFloor: 'Warm-Engaged' },
  { min: 750000, label: 'High (£750K+)', qualityBoost: 25, classificationFloor: 'Nurture-Premium' },
  { min: 500000, label: 'Good (£500K+)', qualityBoost: 20, classificationFloor: 'Nurture-Premium' },
  { min: 400000, label: 'Standard (£400K+)', qualityBoost: 15, classificationFloor: 'Nurture-Standard' },
  { min: 250000, label: 'Entry (£250K+)', qualityBoost: 10, classificationFloor: 'Nurture-Standard' },
  { min: 0, label: 'Unknown', qualityBoost: 0, classificationFloor: 'Cold' },
]

function getBudgetTier(budget: number): BudgetTier {
  for (const tier of BUDGET_TIERS) {
    if (budget >= tier.min) return tier
  }
  return BUDGET_TIERS[BUDGET_TIERS.length - 1]
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function hasConnection(status: string | boolean | undefined | null): boolean {
  if (typeof status === 'boolean') return status
  if (!status) return false
  const normalized = String(status).toLowerCase().trim()
  return normalized === 'yes' || normalized === 'introduced' || normalized === 'true'
}

function parseBudget(budget: string): number {
  if (!budget) return 0

  // Remove currency symbols and whitespace
  const cleaned = budget.replace(/[£$€,\s]/g, '').toLowerCase()

  // Handle ranges like "500k-750k" or "£400K - £500K" - take the higher value
  const rangeMatch = cleaned.match(/(\d+\.?\d*)(k|m)?[-–—to\s]+(\d+\.?\d*)(k|m)?/i)
  if (rangeMatch) {
    const highValue = parseFloat(rangeMatch[3])
    const highMultiplier = rangeMatch[4] === 'k' ? 1000 : rangeMatch[4] === 'm' ? 1000000 : 1
    return highValue * highMultiplier
  }

  // Handle k/m suffixes for single values
  const singleMatch = cleaned.match(/^(\d+\.?\d*)(k|m)?$/)
  if (singleMatch) {
    const value = parseFloat(singleMatch[1])
    const multiplier = singleMatch[2] === 'k' ? 1000 : singleMatch[2] === 'm' ? 1000000 : 1
    return value * multiplier
  }

  // Fallback to parsing as plain number
  return parseFloat(cleaned) || 0
}

function isNewLead(buyer: Buyer): boolean {
  const status = (buyer.status || '').toLowerCase()
  return status.includes('contact pending') || status === '' || !status
}

function getLeadAgeDays(buyer: Buyer): number {
  const dateStr = buyer.date_added || buyer.created_at
  if (!dateStr) return 0

  const leadDate = new Date(dateStr)
  if (isNaN(leadDate.getTime())) return 0

  return Math.floor((Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24))
}

// ═══════════════════════════════════════════════════════════════════
// SPAM DETECTION
// ═══════════════════════════════════════════════════════════════════

const SPAM_PATTERNS = {
  names: [
    /^test/i, /^fake/i, /^asdf/i, /^qwerty/i, /^xxx/i,
    /^aaa+$/i, /^123/i, /^n\/a$/i, /^none$/i, /^null$/i,
  ],
  emails: [
    /test@/i, /fake@/i, /example\.(com|org|net)/i, /mailinator/i,
    /tempmail/i, /guerrillamail/i, /@yopmail/i, /10minutemail/i,
  ],
  phones: [
    /^0{7,}/, /^1{7,}/, /123456789/, /^(\d)\1{6,}/,
  ],
}

export function checkSpam(buyer: Buyer): SpamCheckResult {
  const flags: string[] = []
  let spamScore = 0

  const name = buyer.full_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim()
  const email = buyer.email || ''
  const phone = buyer.phone || ''

  for (const pattern of SPAM_PATTERNS.names) {
    if (pattern.test(name)) {
      flags.push(`Suspicious name: "${name}"`)
      spamScore += 30
      break
    }
  }

  for (const pattern of SPAM_PATTERNS.emails) {
    if (pattern.test(email)) {
      flags.push(`Suspicious email: "${email}"`)
      spamScore += 40
      break
    }
  }

  for (const pattern of SPAM_PATTERNS.phones) {
    if (pattern.test(phone.replace(/\D/g, ''))) {
      flags.push(`Suspicious phone: "${phone}"`)
      spamScore += 30
      break
    }
  }

  if (!email && !phone) {
    flags.push('No contact info')
    spamScore += 20
  }

  if (name.length < 3) {
    flags.push('Name too short')
    spamScore += 15
  }

  const budgetNum = parseBudget(buyer.budget || buyer.budget_range || '')
  if (budgetNum > 0 && budgetNum < 10000) {
    flags.push('Unrealistic budget')
    spamScore += 25
  }

  return {
    isSpam: spamScore >= 50,
    flags,
    confidence: Math.min(spamScore / 100, 1)
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUALITY SCORE (0-100) - Focus on potential, not verification status
// ═══════════════════════════════════════════════════════════════════

export function calculateQualityScore(buyer: Buyer): QualityScoreResult {
  const profileCompleteness = calculateProfileCompleteness(buyer)
  const financialQualification = calculateFinancialQualification(buyer)
  const verificationStatus = calculateVerificationStatus(buyer)
  const inventoryFit = calculateInventoryFit(buyer)

  // Base score from components
  let total = profileCompleteness.score + financialQualification.score +
              verificationStatus.score + inventoryFit.score

  // Budget tier boost - high budget = high quality potential
  const budgetNum = parseBudget(buyer.budget || buyer.budget_range || '')
  const budgetTier = getBudgetTier(budgetNum)
  total += budgetTier.qualityBoost

  // New lead bonus - give benefit of doubt to fresh leads with decent profiles
  if (isNewLead(buyer) && profileCompleteness.score >= 15) {
    total += 10  // Fresh lead with good profile gets a boost
  }

  return {
    total: Math.min(100, Math.round(total)),
    breakdown: {
      profileCompleteness,
      financialQualification,
      verificationStatus,
      inventoryFit
    }
  }
}

function calculateProfileCompleteness(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 25

  const hasName = !!(buyer.full_name || buyer.first_name)
  if (hasName) { score += 5; details.push('+5: Name') }
  if (buyer.email) { score += 5; details.push('+5: Email') }
  if (buyer.phone) { score += 5; details.push('+5: Phone') }
  if (buyer.location || buyer.area) { score += 5; details.push('+5: Location') }
  if (buyer.country) { score += 3; details.push('+3: Country') }
  if (buyer.bedrooms || buyer.preferred_bedrooms) { score += 2; details.push('+2: Bedrooms') }

  return { category: 'Profile Completeness', score: Math.min(maxScore, score), maxScore, details }
}

function calculateFinancialQualification(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 35

  const paymentMethod = (buyer.payment_method || '').toLowerCase()

  // Payment method - strong signal
  if (paymentMethod === 'cash') {
    score += 20  // Cash buyers are serious
    details.push('+20: Cash buyer')
  } else if (paymentMethod === 'mortgage') {
    score += 10
    details.push('+10: Mortgage buyer')

    // Mortgage status bonus
    const mortgageStatus = (buyer.mortgage_status || '').toLowerCase()
    if (mortgageStatus === 'approved' || mortgageStatus === 'aip') {
      score += 10
      details.push('+10: Mortgage approved/AIP')
    } else if (mortgageStatus === 'in progress' || mortgageStatus === 'applied') {
      score += 5
      details.push('+5: Mortgage in progress')
    }
  }

  // Proof of funds (bonus, not required)
  if (buyer.proof_of_funds) {
    score += 10
    details.push('+10: Proof of funds')
  }

  // Budget presence
  if (buyer.budget || buyer.budget_range || buyer.budget_min) {
    score += 5
    details.push('+5: Budget specified')
  }

  return { category: 'Financial Qualification', score: Math.min(maxScore, score), maxScore, details }
}

function calculateVerificationStatus(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 20

  // These are bonuses, not requirements - new leads won't have them
  if (hasConnection(buyer.uk_broker)) {
    score += 6
    details.push('+6: UK broker')
  }

  if (hasConnection(buyer.uk_solicitor)) {
    score += 6
    details.push('+6: UK solicitor')
  }

  // Valid contact formats (baseline verification)
  if (buyer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) {
    score += 4
    details.push('+4: Valid email')
  }

  if (buyer.phone && buyer.phone.replace(/\D/g, '').length >= 10) {
    score += 4
    details.push('+4: Valid phone')
  }

  return { category: 'Verification Status', score: Math.min(maxScore, score), maxScore, details }
}

function calculateInventoryFit(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 20

  if (buyer.location || buyer.area) {
    score += 8
    details.push('+8: Location preference')
  }

  if (buyer.bedrooms || buyer.preferred_bedrooms) {
    score += 6
    details.push('+6: Bedroom preference')
  }

  if (buyer.budget || buyer.budget_range || buyer.budget_min) {
    score += 6
    details.push('+6: Budget range')
  }

  return { category: 'Inventory Fit', score: Math.min(maxScore, score), maxScore, details }
}

// ═══════════════════════════════════════════════════════════════════
// INTENT SCORE (0-100) - Adjusted for new leads
// ═══════════════════════════════════════════════════════════════════

export function calculateIntentScore(buyer: Buyer): IntentScoreResult {
  const timeline = calculateTimelineIntent(buyer)
  const purpose = calculatePurposeIntent(buyer)
  const engagement = calculateEngagementIntent(buyer)
  const commitment = calculateCommitmentIntent(buyer)
  const negativeModifiers = calculateNegativeModifiers(buyer)

  let rawTotal = timeline.score + purpose.score + engagement.score +
                 commitment.score + negativeModifiers.score

  // Note: Budget does NOT affect intent score - intent is about behaviour/engagement
  // Budget only affects quality score and classification floor

  // New lead baseline - don't start at near-zero
  if (isNewLead(buyer)) {
    // New leads with good profiles deserve baseline intent score
    const hasGoodProfile = !!(buyer.email && buyer.phone &&
                              (buyer.budget || buyer.budget_range))
    if (hasGoodProfile) {
      rawTotal += 15  // Baseline for new leads who provided good info
    }
  }

  return {
    total: Math.max(0, Math.min(100, Math.round(rawTotal))),
    breakdown: {
      timeline,
      purpose,
      engagement,
      commitment,
      negativeModifiers
    }
  }
}

function calculateTimelineIntent(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 30

  const timeline = (buyer.timeline || '').toLowerCase()

  if (/immediate|asap|now|28 days|1 month|urgent/i.test(timeline)) {
    score = 30
    details.push('+30: Immediate')
  } else if (/1-3 months|2-3 months|3 months|soon/i.test(timeline)) {
    score = 20
    details.push('+20: 1-3 months')
  } else if (/3-6 months|6 months|this year/i.test(timeline)) {
    score = 12
    details.push('+12: 3-6 months')
  } else if (/6-12|12 months|next year/i.test(timeline)) {
    score = 6
    details.push('+6: 6-12 months')
  } else if (timeline) {
    score = 5
    details.push('+5: Timeline specified')
  }

  return { category: 'Timeline', score: Math.min(maxScore, score), maxScore, details }
}

function calculatePurposeIntent(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 25

  const paymentMethod = (buyer.payment_method || '').toLowerCase()

  if (paymentMethod === 'cash') {
    score += 15
    details.push('+15: Cash buyer (high intent)')
  } else if (paymentMethod === 'mortgage') {
    score += 10
    details.push('+10: Mortgage buyer')
  }

  // Specific preferences indicate research/seriousness
  if ((buyer.bedrooms || buyer.preferred_bedrooms) && (buyer.location || buyer.area)) {
    score += 10
    details.push('+10: Specific criteria')
  }

  return { category: 'Purpose', score: Math.min(maxScore, score), maxScore, details }
}

function calculateEngagementIntent(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 25

  const status = (buyer.status || '').toLowerCase()

  // Status progression
  if (status.includes('reserved') || status.includes('exchanged') || status.includes('completed')) {
    score += 25
    details.push('+25: Committed')
  } else if (status.includes('viewing booked') || status.includes('negotiating')) {
    score += 20
    details.push('+20: Active engagement')
  } else if (status.includes('follow up')) {
    score += 12
    details.push('+12: In follow-up')
  } else if (status.includes('contact pending') || !status) {
    // New leads get baseline - they haven't had chance to engage yet
    score += 8
    details.push('+8: New lead (pending contact)')
  }

  // Source quality
  const source = (buyer.source || '').toLowerCase()
  if (/referral|direct|website|walk.?in/i.test(source)) {
    score += 5
    details.push('+5: High-intent source')
  }

  return { category: 'Engagement', score: Math.min(maxScore, score), maxScore, details }
}

function calculateCommitmentIntent(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 20

  if (buyer.proof_of_funds) {
    score += 8
    details.push('+8: Proof of funds')
  }

  const mortgageStatus = (buyer.mortgage_status || '').toLowerCase()
  if (mortgageStatus === 'approved' || mortgageStatus === 'aip') {
    score += 7
    details.push('+7: Mortgage approved')
  }

  if (hasConnection(buyer.uk_solicitor)) {
    score += 5
    details.push('+5: Solicitor')
  }

  return { category: 'Commitment', score: Math.min(maxScore, score), maxScore, details }
}

function calculateNegativeModifiers(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 0

  const status = (buyer.status || '').toLowerCase()

  if (status.includes('not proceeding')) {
    score -= 50
    details.push('-50: Not proceeding')
  }

  if (status.includes('fake') || status.includes('cant verify') || status.includes('disqualified')) {
    score -= 75
    details.push('-75: Disqualified/Fake')
  }

  if (status.includes('duplicate')) {
    score -= 25
    details.push('-25: Duplicate')
  }

  // Stale lead penalty (only if old AND no contact)
  const leadAge = getLeadAgeDays(buyer)
  if (leadAge > 90 && !buyer.last_contact) {
    score -= 15
    details.push('-15: Stale (90+ days)')
  }

  return { category: 'Negative Modifiers', score, maxScore, details }
}

// ═══════════════════════════════════════════════════════════════════
// CONFIDENCE SCORE (0-10)
// ═══════════════════════════════════════════════════════════════════

export function calculateConfidenceScore(buyer: Buyer): ConfidenceScoreResult {
  const dataCompleteness = calculateDataCompleteness(buyer)
  const verificationLevel = calculateVerificationConfidence(buyer)
  const engagementData = calculateEngagementConfidence(buyer)
  const transcriptQuality = calculateTranscriptQuality(buyer)

  const total = Math.min(10, Number((
    (dataCompleteness.score / dataCompleteness.maxScore * 4) +
    (verificationLevel.score / verificationLevel.maxScore * 3) +
    (engagementData.score / engagementData.maxScore * 2) +
    (transcriptQuality.score / transcriptQuality.maxScore * 1)
  ).toFixed(1)))

  return {
    total,
    breakdown: {
      dataCompleteness,
      verificationLevel,
      engagementData,
      transcriptQuality
    }
  }
}

function calculateDataCompleteness(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 10

  const fields = [
    { field: buyer.full_name || buyer.first_name, name: 'Name' },
    { field: buyer.email, name: 'Email' },
    { field: buyer.phone, name: 'Phone' },
    { field: buyer.country, name: 'Country' },
    { field: buyer.budget || buyer.budget_range, name: 'Budget' },
    { field: buyer.timeline, name: 'Timeline' },
    { field: buyer.payment_method, name: 'Payment' },
    { field: buyer.location || buyer.area, name: 'Location' },
    { field: buyer.bedrooms || buyer.preferred_bedrooms, name: 'Bedrooms' },
    { field: buyer.source, name: 'Source' },
  ]

  for (const { field, name } of fields) {
    if (field) {
      score += 1
      details.push(`+1: ${name}`)
    }
  }

  return { category: 'Data Completeness', score: Math.min(maxScore, score), maxScore, details }
}

function calculateVerificationConfidence(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 10

  if (buyer.proof_of_funds) { score += 4; details.push('+4: Proof of funds') }
  if (hasConnection(buyer.uk_broker)) { score += 3; details.push('+3: UK broker') }
  if (hasConnection(buyer.uk_solicitor)) { score += 3; details.push('+3: UK solicitor') }

  return { category: 'Verification Level', score: Math.min(maxScore, score), maxScore, details }
}

function calculateEngagementConfidence(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 10

  const status = (buyer.status || '').toLowerCase()
  if (status.includes('viewing') || status.includes('negotiating') ||
      status.includes('reserved') || status.includes('exchanged')) {
    score += 4
    details.push('+4: Advanced status')
  }

  if (buyer.last_contact) { score += 3; details.push('+3: Contact logged') }
  if (buyer.notes && buyer.notes.length > 50) { score += 3; details.push('+3: Has notes') }

  return { category: 'Engagement Data', score: Math.min(maxScore, score), maxScore, details }
}

function calculateTranscriptQuality(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 10

  if (buyer.notes) {
    const len = buyer.notes.length
    if (len > 500) { score = 10; details.push('+10: Comprehensive notes') }
    else if (len > 200) { score = 7; details.push('+7: Detailed notes') }
    else if (len > 50) { score = 4; details.push('+4: Basic notes') }
    else { score = 2; details.push('+2: Minimal notes') }
  }

  return { category: 'Transcript Quality', score: Math.min(maxScore, score), maxScore, details }
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIFICATION - Budget-aware with floors
// ═══════════════════════════════════════════════════════════════════

export function determineClassification(
  qualityScore: number,
  intentScore: number,
  confidenceScore: number,
  spamCheck: SpamCheckResult,
  buyer?: Buyer
): Classification {
  // Spam check first - only spam gets auto-disqualified
  if (spamCheck.isSpam) return 'Spam'

  // Check for explicit fake/spam status ONLY
  // New leads should NEVER be auto-disqualified for low scores
  const status = (buyer?.status || '').toLowerCase()
  if (status.includes('fake') || status.includes('cant verify') ||
      status.includes('spam') || status.includes('test lead')) {
    return 'Disqualified'
  }

  // "Not Proceeding" is different from Disqualified - they're real leads that opted out
  // Keep them as Cold, not Disqualified
  if (status.includes('not proceeding')) {
    return 'Cold'
  }

  // Get budget floor - high budget leads get minimum classification
  const budgetNum = parseBudget(buyer?.budget || buyer?.budget_range || '')
  const budgetTier = getBudgetTier(budgetNum)

  // Calculate raw classification based on scores
  let classification: Classification = 'Cold'

  const combinedScore = (qualityScore * 0.5) + (intentScore * 0.5)

  if (combinedScore >= 75 || (qualityScore >= 70 && intentScore >= 70)) {
    classification = 'Hot'
  } else if (combinedScore >= 60 || (qualityScore >= 65 && intentScore >= 50)) {
    classification = 'Warm-Qualified'
  } else if (combinedScore >= 50 || (qualityScore >= 50 && intentScore >= 60)) {
    classification = 'Warm-Engaged'
  } else if (combinedScore >= 40 || (qualityScore >= 45 && intentScore >= 40)) {
    classification = 'Nurture-Premium'
  } else if (combinedScore >= 30 || (qualityScore >= 35 && intentScore >= 30)) {
    classification = 'Nurture-Standard'
  }

  // Apply budget floor - high budget leads get minimum classification
  const classificationRank: Record<Classification, number> = {
    'Hot': 7,
    'Warm-Qualified': 6,
    'Warm-Engaged': 5,
    'Nurture-Premium': 4,
    'Nurture-Standard': 3,
    'Cold': 2,
    'Disqualified': 1,
    'Spam': 0
  }

  const currentRank = classificationRank[classification]
  const floorRank = classificationRank[budgetTier.classificationFloor]

  // Use higher of calculated vs floor
  if (floorRank > currentRank) {
    classification = budgetTier.classificationFloor
  }

  return classification
}

// ═══════════════════════════════════════════════════════════════════
// PRIORITY ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════

export function determinePriority(
  classification: Classification,
  qualityScore: number,
  intentScore: number
): PriorityInfo {
  if (classification === 'Hot') {
    return {
      priority: 'P1',
      responseTime: '< 1 hour',
      description: 'High-value lead - immediate action'
    }
  }

  if (classification === 'Warm-Qualified' || classification === 'Warm-Engaged') {
    return {
      priority: 'P2',
      responseTime: '< 4 hours',
      description: 'Qualified lead - same day response'
    }
  }

  if (classification === 'Nurture-Premium' || classification === 'Nurture-Standard') {
    return {
      priority: 'P3',
      responseTime: '< 24 hours',
      description: 'Nurture lead - follow up within 24h'
    }
  }

  return {
    priority: 'P4',
    responseTime: '48+ hours',
    description: 'Low priority - review when available'
  }
}

// ═══════════════════════════════════════════════════════════════════
// RISK FLAG GENERATION
// ═══════════════════════════════════════════════════════════════════

export function generateRiskFlags(buyer: Buyer, scores: {
  quality: QualityScoreResult
  intent: IntentScoreResult
  confidence: ConfidenceScoreResult
  spamCheck: SpamCheckResult
}): string[] {
  const flags: string[] = []

  // Financial verification needed
  if (!buyer.proof_of_funds && buyer.payment_method?.toLowerCase() === 'cash') {
    flags.push('Request proof of funds')
  }

  if (buyer.payment_method?.toLowerCase() === 'mortgage' &&
      !['approved', 'aip'].includes((buyer.mortgage_status || '').toLowerCase())) {
    flags.push('Mortgage status unknown')
  }

  // Geographic
  const country = (buyer.country || '').toLowerCase()
  if (country && !['uk', 'united kingdom', 'england', 'scotland', 'wales', 'gb', 'great britain'].includes(country)) {
    flags.push('International buyer')
  }

  // Contact info
  if (!buyer.phone && !buyer.email) {
    flags.push('No contact details')
  }

  // Timeline
  if (!buyer.timeline) {
    flags.push('Clarify timeline')
  }

  // Lead age
  const leadAge = getLeadAgeDays(buyer)
  if (leadAge > 60 && !buyer.last_contact) {
    flags.push(`${leadAge} days old - no contact`)
  }

  // Low confidence
  if (scores.confidence.total < 4) {
    flags.push('Low data confidence')
  }

  return flags.slice(0, 4)
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCORING FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function scoreLead(buyer: Buyer): LeadScoreResult {
  const spamCheck = checkSpam(buyer)
  const qualityScore = calculateQualityScore(buyer)
  const intentScore = calculateIntentScore(buyer)
  const confidenceScore = calculateConfidenceScore(buyer)

  const classification = determineClassification(
    qualityScore.total,
    intentScore.total,
    confidenceScore.total,
    spamCheck,
    buyer  // Pass buyer for budget floor
  )

  const priority = determinePriority(
    classification,
    qualityScore.total,
    intentScore.total
  )

  const riskFlags = generateRiskFlags(buyer, {
    quality: qualityScore,
    intent: intentScore,
    confidence: confidenceScore,
    spamCheck
  })

  return {
    spamCheck,
    qualityScore,
    intentScore,
    confidenceScore,
    classification,
    priority,
    riskFlags
  }
}
