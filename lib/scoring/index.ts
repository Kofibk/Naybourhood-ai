/**
 * Lead Scoring System
 *
 * Comprehensive scoring for real estate leads including:
 * - Spam detection and automatic flagging
 * - Quality Score (0-100): Profile, Financial, Verification, Fit
 * - Intent Score (0-100): Timeline, Purpose, Engagement, Commitment
 * - Confidence Score (0-10): Data completeness and verification
 * - Classification: Hot, Warm-Qualified, Warm-Engaged, Nurture, Cold
 * - Priority: P1-P4 with response time SLAs
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
// SPAM DETECTION
// ═══════════════════════════════════════════════════════════════════

const SPAM_PATTERNS = {
  names: [
    /^test/i,
    /^fake/i,
    /^asdf/i,
    /^qwerty/i,
    /^xxx/i,
    /^aaa+$/i,
    /^123/i,
    /^n\/a$/i,
    /^none$/i,
    /^null$/i,
  ],
  emails: [
    /test@/i,
    /fake@/i,
    /example\.(com|org|net)/i,
    /mailinator/i,
    /tempmail/i,
    /guerrillamail/i,
    /@yopmail/i,
    /10minutemail/i,
  ],
  phones: [
    /^0{7,}/,
    /^1{7,}/,
    /123456789/,
    /^(\d)\1{6,}/,  // Same digit repeated 7+ times
  ],
}

export function checkSpam(buyer: Buyer): SpamCheckResult {
  const flags: string[] = []
  let spamScore = 0

  const name = buyer.full_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim()
  const email = buyer.email || ''
  const phone = buyer.phone || ''

  // Check name patterns
  for (const pattern of SPAM_PATTERNS.names) {
    if (pattern.test(name)) {
      flags.push(`Suspicious name pattern: "${name}"`)
      spamScore += 30
      break
    }
  }

  // Check email patterns
  for (const pattern of SPAM_PATTERNS.emails) {
    if (pattern.test(email)) {
      flags.push(`Suspicious email domain: "${email}"`)
      spamScore += 40
      break
    }
  }

  // Check phone patterns
  for (const pattern of SPAM_PATTERNS.phones) {
    if (pattern.test(phone.replace(/\D/g, ''))) {
      flags.push(`Suspicious phone number: "${phone}"`)
      spamScore += 30
      break
    }
  }

  // No contact info at all
  if (!email && !phone) {
    flags.push('No contact information provided')
    spamScore += 20
  }

  // Very short or missing name
  if (name.length < 3) {
    flags.push('Name too short or missing')
    spamScore += 15
  }

  // Budget seems unrealistic
  const budgetNum = parseBudget(buyer.budget || buyer.budget_range || '')
  if (budgetNum > 0 && budgetNum < 10000) {
    flags.push('Budget unrealistically low for real estate')
    spamScore += 25
  }

  return {
    isSpam: spamScore >= 50,
    flags,
    confidence: Math.min(spamScore / 100, 1)
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUALITY SCORE (0-100)
// ═══════════════════════════════════════════════════════════════════

export function calculateQualityScore(buyer: Buyer): QualityScoreResult {
  // Profile Completeness (max 25)
  const profileCompleteness = calculateProfileCompleteness(buyer)

  // Financial Qualification (max 35)
  const financialQualification = calculateFinancialQualification(buyer)

  // Verification Status (max 20)
  const verificationStatus = calculateVerificationStatus(buyer)

  // Inventory Fit (max 20)
  const inventoryFit = calculateInventoryFit(buyer)

  const total = Math.min(100, Math.round(
    profileCompleteness.score +
    financialQualification.score +
    verificationStatus.score +
    inventoryFit.score
  ))

  return {
    total,
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

  // Name (5 points)
  const hasName = !!(buyer.full_name || buyer.first_name)
  if (hasName) {
    score += 5
    details.push('+5: Name provided')
  }

  // Email (5 points)
  if (buyer.email) {
    score += 5
    details.push('+5: Email provided')
  }

  // Phone (5 points)
  if (buyer.phone) {
    score += 5
    details.push('+5: Phone provided')
  }

  // Location/Area (5 points)
  if (buyer.location || buyer.area) {
    score += 5
    details.push('+5: Location specified')
  }

  // Country (3 points)
  if (buyer.country) {
    score += 3
    details.push('+3: Country specified')
  }

  // Bedrooms preference (2 points)
  if (buyer.bedrooms || buyer.preferred_bedrooms) {
    score += 2
    details.push('+2: Bedroom preference specified')
  }

  return { category: 'Profile Completeness', score: Math.min(maxScore, score), maxScore, details }
}

function calculateFinancialQualification(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 35

  // Payment method (10 points for cash, 5 for mortgage)
  const paymentMethod = buyer.payment_method?.toLowerCase()
  if (paymentMethod === 'cash') {
    score += 15
    details.push('+15: Cash buyer')
  } else if (paymentMethod === 'mortgage') {
    score += 5
    details.push('+5: Mortgage buyer')
  }

  // Mortgage status (up to 10 points)
  const mortgageStatus = buyer.mortgage_status?.toLowerCase()
  if (mortgageStatus === 'approved' || mortgageStatus === 'aip') {
    score += 10
    details.push('+10: Mortgage approved/AIP')
  } else if (mortgageStatus === 'in progress' || mortgageStatus === 'applied') {
    score += 5
    details.push('+5: Mortgage in progress')
  }

  // Proof of funds (10 points)
  if (buyer.proof_of_funds) {
    score += 10
    details.push('+10: Proof of funds received')
  }

  // Budget specified (5 points)
  if (buyer.budget || buyer.budget_range || buyer.budget_min) {
    score += 5
    details.push('+5: Budget specified')

    // Higher budget bonus (up to 5 points)
    const budgetNum = parseBudget(buyer.budget || buyer.budget_range || '')
    if (budgetNum >= 1000000) {
      score += 5
      details.push('+5: Premium budget (£1M+)')
    } else if (budgetNum >= 500000) {
      score += 3
      details.push('+3: Good budget (£500k+)')
    }
  }

  return { category: 'Financial Qualification', score: Math.min(maxScore, score), maxScore, details }
}

function calculateVerificationStatus(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 20

  // UK Broker connected (8 points)
  if (buyer.uk_broker) {
    score += 8
    details.push('+8: UK broker connected')
  }

  // UK Solicitor (7 points)
  if (buyer.uk_solicitor) {
    score += 7
    details.push('+7: UK solicitor appointed')
  }

  // Has valid email format (2 points)
  if (buyer.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) {
    score += 2
    details.push('+2: Valid email format')
  }

  // Has valid phone format (3 points)
  if (buyer.phone && buyer.phone.replace(/\D/g, '').length >= 10) {
    score += 3
    details.push('+3: Valid phone number')
  }

  return { category: 'Verification Status', score: Math.min(maxScore, score), maxScore, details }
}

function calculateInventoryFit(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 20

  // Has location preference (8 points)
  if (buyer.location || buyer.area) {
    score += 8
    details.push('+8: Location preference specified')
  }

  // Has bedroom preference (6 points)
  if (buyer.bedrooms || buyer.preferred_bedrooms) {
    score += 6
    details.push('+6: Bedroom preference specified')
  }

  // Has budget matching criteria (6 points)
  if (buyer.budget || buyer.budget_range || buyer.budget_min) {
    score += 6
    details.push('+6: Budget range specified')
  }

  return { category: 'Inventory Fit', score: Math.min(maxScore, score), maxScore, details }
}

// ═══════════════════════════════════════════════════════════════════
// INTENT SCORE (0-100)
// ═══════════════════════════════════════════════════════════════════

export function calculateIntentScore(buyer: Buyer): IntentScoreResult {
  const timeline = calculateTimelineIntent(buyer)
  const purpose = calculatePurposeIntent(buyer)
  const engagement = calculateEngagementIntent(buyer)
  const commitment = calculateCommitmentIntent(buyer)
  const negativeModifiers = calculateNegativeModifiers(buyer)

  const rawTotal = timeline.score + purpose.score + engagement.score + commitment.score + negativeModifiers.score
  const total = Math.max(0, Math.min(100, Math.round(rawTotal)))

  return {
    total,
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

  // Immediate (30 points)
  if (/immediate|asap|now|28 days|1 month|urgent/i.test(timeline)) {
    score = 30
    details.push('+30: Immediate timeline')
  }
  // Short-term (20 points)
  else if (/1-3 months|2-3 months|3 months|soon/i.test(timeline)) {
    score = 20
    details.push('+20: Short-term timeline (1-3 months)')
  }
  // Medium-term (10 points)
  else if (/3-6 months|6 months|this year/i.test(timeline)) {
    score = 10
    details.push('+10: Medium-term timeline (3-6 months)')
  }
  // Long-term (5 points)
  else if (/6-12|12 months|next year/i.test(timeline)) {
    score = 5
    details.push('+5: Long-term timeline (6-12 months)')
  }
  // Has any timeline (3 points)
  else if (timeline) {
    score = 3
    details.push('+3: Timeline specified')
  }

  return { category: 'Timeline', score: Math.min(maxScore, score), maxScore, details }
}

function calculatePurposeIntent(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 25

  // Payment method indicates purpose
  const paymentMethod = (buyer.payment_method || '').toLowerCase()

  // Cash buyers typically more serious
  if (paymentMethod === 'cash') {
    score += 15
    details.push('+15: Cash buyer (high intent)')
  } else if (paymentMethod === 'mortgage') {
    score += 10
    details.push('+10: Mortgage buyer (committed to process)')
  }

  // Has specific preferences (indicates research)
  if ((buyer.bedrooms || buyer.preferred_bedrooms) && (buyer.location || buyer.area)) {
    score += 10
    details.push('+10: Specific property criteria')
  }

  return { category: 'Purpose', score: Math.min(maxScore, score), maxScore, details }
}

function calculateEngagementIntent(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 25

  // Status indicates engagement level
  const status = (buyer.status || '').toLowerCase()

  if (status.includes('viewing booked') || status.includes('negotiating')) {
    score += 25
    details.push('+25: Active engagement (viewing/negotiating)')
  } else if (status.includes('reserved') || status.includes('exchanged')) {
    score += 25
    details.push('+25: Committed (reserved/exchanged)')
  } else if (status.includes('follow up')) {
    score += 15
    details.push('+15: In follow-up stage')
  } else if (status.includes('contact pending')) {
    score += 5
    details.push('+5: Awaiting contact')
  }

  // Source quality indicates intent
  const source = (buyer.source || '').toLowerCase()
  if (/referral|direct|website/i.test(source)) {
    score += 5
    details.push('+5: High-intent source')
  }

  return { category: 'Engagement', score: Math.min(maxScore, score), maxScore, details }
}

function calculateCommitmentIntent(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 20

  // Proof of funds shows commitment
  if (buyer.proof_of_funds) {
    score += 10
    details.push('+10: Proof of funds provided')
  }

  // Mortgage approval shows commitment
  const mortgageStatus = (buyer.mortgage_status || '').toLowerCase()
  if (mortgageStatus === 'approved' || mortgageStatus === 'aip') {
    score += 8
    details.push('+8: Mortgage approved/AIP')
  }

  // Legal team in place
  if (buyer.uk_solicitor) {
    score += 5
    details.push('+5: Solicitor appointed')
  }

  return { category: 'Commitment', score: Math.min(maxScore, score), maxScore, details }
}

function calculateNegativeModifiers(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 0  // This is a deduction category

  const status = (buyer.status || '').toLowerCase()

  // Negative statuses
  if (status.includes('not proceeding')) {
    score -= 50
    details.push('-50: Not proceeding')
  }

  if (status.includes('fake') || status.includes('cant verify')) {
    score -= 75
    details.push('-75: Fake/Unverifiable')
  }

  if (status.includes('duplicate')) {
    score -= 25
    details.push('-25: Duplicate lead')
  }

  // Very old lead with no recent activity
  if (buyer.created_at || buyer.date_added) {
    const leadDate = new Date(buyer.date_added || buyer.created_at || '')
    const daysSinceCreated = Math.floor((Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceCreated > 90 && !buyer.last_contact) {
      score -= 15
      details.push('-15: Stale lead (90+ days, no contact)')
    }
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
    { field: buyer.full_name || buyer.first_name, name: 'Name', points: 1 },
    { field: buyer.email, name: 'Email', points: 1 },
    { field: buyer.phone, name: 'Phone', points: 1 },
    { field: buyer.country, name: 'Country', points: 1 },
    { field: buyer.budget || buyer.budget_range, name: 'Budget', points: 1 },
    { field: buyer.timeline, name: 'Timeline', points: 1 },
    { field: buyer.payment_method, name: 'Payment Method', points: 1 },
    { field: buyer.location || buyer.area, name: 'Location', points: 1 },
    { field: buyer.bedrooms || buyer.preferred_bedrooms, name: 'Bedrooms', points: 1 },
    { field: buyer.source, name: 'Source', points: 1 },
  ]

  for (const { field, name, points } of fields) {
    if (field) {
      score += points
      details.push(`+${points}: ${name} provided`)
    }
  }

  return { category: 'Data Completeness', score: Math.min(maxScore, score), maxScore, details }
}

function calculateVerificationConfidence(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 10

  // Proof of funds (4 points)
  if (buyer.proof_of_funds) {
    score += 4
    details.push('+4: Proof of funds verified')
  }

  // UK Broker (3 points)
  if (buyer.uk_broker) {
    score += 3
    details.push('+3: UK broker connected')
  }

  // UK Solicitor (3 points)
  if (buyer.uk_solicitor) {
    score += 3
    details.push('+3: UK solicitor appointed')
  }

  return { category: 'Verification Level', score: Math.min(maxScore, score), maxScore, details }
}

function calculateEngagementConfidence(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 10

  // Has status progression (4 points)
  const status = (buyer.status || '').toLowerCase()
  if (status.includes('viewing') || status.includes('negotiating') ||
      status.includes('reserved') || status.includes('exchanged')) {
    score += 4
    details.push('+4: Advanced in pipeline')
  }

  // Has last contact (3 points)
  if (buyer.last_contact) {
    score += 3
    details.push('+3: Recent contact logged')
  }

  // Has notes (3 points)
  if (buyer.notes && buyer.notes.length > 50) {
    score += 3
    details.push('+3: Detailed notes available')
  }

  return { category: 'Engagement Data', score: Math.min(maxScore, score), maxScore, details }
}

function calculateTranscriptQuality(buyer: Buyer): ScoreBreakdown {
  let score = 0
  const details: string[] = []
  const maxScore = 10

  // Has notes (this would be transcript in a full implementation)
  if (buyer.notes) {
    const noteLength = buyer.notes.length
    if (noteLength > 500) {
      score = 10
      details.push('+10: Comprehensive notes/transcript')
    } else if (noteLength > 200) {
      score = 7
      details.push('+7: Detailed notes')
    } else if (noteLength > 50) {
      score = 4
      details.push('+4: Basic notes')
    } else {
      score = 2
      details.push('+2: Minimal notes')
    }
  }

  return { category: 'Transcript Quality', score: Math.min(maxScore, score), maxScore, details }
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIFICATION MATRIX
// ═══════════════════════════════════════════════════════════════════

export function determineClassification(
  qualityScore: number,
  intentScore: number,
  confidenceScore: number,
  spamCheck: SpamCheckResult
): Classification {
  // Spam check first
  if (spamCheck.isSpam) {
    return 'Spam'
  }

  // Very low scores = disqualified
  if (qualityScore < 20 || intentScore < 20) {
    return 'Disqualified'
  }

  // Hot leads: High quality + High intent
  if (qualityScore >= 70 && intentScore >= 70) {
    return 'Hot'
  }

  // Warm-Qualified: High quality, moderate intent
  if (qualityScore >= 70 && intentScore >= 45) {
    return 'Warm-Qualified'
  }

  // Warm-Engaged: Moderate quality, high intent
  if (qualityScore >= 45 && intentScore >= 70) {
    return 'Warm-Engaged'
  }

  // Nurture-Premium: Good scores but not quite hot
  if (qualityScore >= 55 && intentScore >= 45) {
    return 'Nurture-Premium'
  }

  // Nurture-Standard: Average scores
  if (qualityScore >= 35 && intentScore >= 35) {
    return 'Nurture-Standard'
  }

  // Cold: Low scores but not disqualified
  return 'Cold'
}

// ═══════════════════════════════════════════════════════════════════
// PRIORITY ASSIGNMENT
// ═══════════════════════════════════════════════════════════════════

export function determinePriority(
  classification: Classification,
  qualityScore: number,
  intentScore: number
): PriorityInfo {
  // P1: Hot leads - respond immediately
  if (classification === 'Hot') {
    return {
      priority: 'P1',
      responseTime: '< 1 hour',
      description: 'High-value, high-intent lead requiring immediate attention'
    }
  }

  // P2: Warm leads - respond same day
  if (classification === 'Warm-Qualified' || classification === 'Warm-Engaged') {
    return {
      priority: 'P2',
      responseTime: '< 4 hours',
      description: 'Qualified lead showing strong interest'
    }
  }

  // P3: Nurture leads - respond within 24 hours
  if (classification === 'Nurture-Premium' || classification === 'Nurture-Standard') {
    return {
      priority: 'P3',
      responseTime: '< 24 hours',
      description: 'Lead requiring nurturing and follow-up'
    }
  }

  // P4: Cold, Disqualified, Spam - low priority
  return {
    priority: 'P4',
    responseTime: '48+ hours',
    description: 'Low priority lead for review'
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

  // Financial risks
  if (!buyer.proof_of_funds && buyer.payment_method?.toLowerCase() !== 'cash') {
    flags.push('No proof of funds received')
  }

  if (buyer.payment_method?.toLowerCase() === 'mortgage' &&
      !['approved', 'aip'].includes((buyer.mortgage_status || '').toLowerCase())) {
    flags.push('Mortgage not yet approved')
  }

  // Geographic risks
  const country = (buyer.country || '').toLowerCase()
  if (country && !['uk', 'united kingdom', 'england', 'scotland', 'wales'].includes(country)) {
    flags.push('International buyer - may need extended timeline')
  }

  // Contact risks
  if (!buyer.phone && !buyer.email) {
    flags.push('Limited contact information')
  }

  // Verification risks
  if (!buyer.uk_broker && buyer.payment_method?.toLowerCase() === 'mortgage') {
    flags.push('No UK broker connected (mortgage buyer)')
  }

  // Data quality risks
  if (scores.confidence.total < 5) {
    flags.push('Low data confidence - needs verification')
  }

  // Spam-related flags
  if (scores.spamCheck.flags.length > 0 && !scores.spamCheck.isSpam) {
    flags.push(...scores.spamCheck.flags.slice(0, 2))  // Only first 2
  }

  // Timeline risks
  if (!buyer.timeline) {
    flags.push('Timeline not specified')
  }

  // Stale lead risk
  if (buyer.created_at || buyer.date_added) {
    const leadDate = new Date(buyer.date_added || buyer.created_at || '')
    const daysSinceCreated = Math.floor((Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceCreated > 60) {
      flags.push(`Lead is ${daysSinceCreated} days old`)
    }
  }

  return flags.slice(0, 5)  // Max 5 flags
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCORING FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function scoreLead(buyer: Buyer): LeadScoreResult {
  // 1. Spam check first
  const spamCheck = checkSpam(buyer)

  // 2. Calculate all scores
  const qualityScore = calculateQualityScore(buyer)
  const intentScore = calculateIntentScore(buyer)
  const confidenceScore = calculateConfidenceScore(buyer)

  // 3. Determine classification
  const classification = determineClassification(
    qualityScore.total,
    intentScore.total,
    confidenceScore.total,
    spamCheck
  )

  // 4. Determine priority
  const priority = determinePriority(
    classification,
    qualityScore.total,
    intentScore.total
  )

  // 5. Generate risk flags
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

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function parseBudget(budget: string): number {
  if (!budget) return 0

  // Remove currency symbols and whitespace
  const cleaned = budget.replace(/[£$€,\s]/g, '').toLowerCase()

  // Handle k/m suffixes
  if (cleaned.endsWith('k')) {
    return parseFloat(cleaned.slice(0, -1)) * 1000
  }
  if (cleaned.endsWith('m')) {
    return parseFloat(cleaned.slice(0, -1)) * 1000000
  }

  // Handle ranges like "500k-750k"
  const rangeMatch = cleaned.match(/(\d+)k?-(\d+)k?/)
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1]) * (rangeMatch[0].includes('k') ? 1000 : 1)
    return low
  }

  return parseFloat(cleaned) || 0
}
