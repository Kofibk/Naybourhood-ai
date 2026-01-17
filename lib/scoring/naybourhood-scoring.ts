/**
 * Naybourhood AI Scoring Framework
 *
 * SCORING HIERARCHY: Financial Proceedability > Commitment Signals > Realism > Engagement
 *
 * This scoring system prioritizes leads based on their likelihood to complete a purchase,
 * with special handling for 28-day intent buyers and automatic disqualification rules.
 */

import type { Buyer } from '@/types'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface NaybourhoodScoreBreakdown {
  factor: string
  points: number
  reason: string
}

export interface QualityScoreResult {
  total: number
  breakdown: NaybourhoodScoreBreakdown[]
  isDisqualified: boolean
  disqualificationReason?: string
}

export interface IntentScoreResult {
  total: number
  breakdown: NaybourhoodScoreBreakdown[]
  is28DayBuyer: boolean
}

export interface ConfidenceScoreResult {
  total: number  // 0-100 scale
  breakdown: NaybourhoodScoreBreakdown[]
}

export type NaybourhoodClassification =
  | 'Hot Lead'
  | 'Qualified'
  | 'Needs Qualification'
  | 'Nurture'
  | 'Low Priority'
  | 'Disqualified'

export interface FakeLeadCheckResult {
  isFake: boolean
  flags: string[]
  confidence: number  // 0-1
}

export interface CallPriority {
  level: number  // 1-5, where 1 is highest priority
  description: string
  responseTime: string
}

export interface NaybourhoodScoreResult {
  fakeLeadCheck: FakeLeadCheckResult
  qualityScore: QualityScoreResult
  intentScore: IntentScoreResult
  confidenceScore: ConfidenceScoreResult
  classification: NaybourhoodClassification
  callPriority: CallPriority
  riskFlags: string[]
  is28DayBuyer: boolean
  lowUrgencyFlag: boolean
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse budget string to numeric value
 */
function parseBudget(budget: string | number | undefined | null): number {
  if (!budget) return 0
  if (typeof budget === 'number') return budget

  const cleaned = String(budget).replace(/[£$€,\s]/g, '').toLowerCase()

  // Handle ranges like "500k-750k" - take the lower bound
  const rangeMatch = cleaned.match(/(\d+\.?\d*)(k|m)?[-–—to\s]+(\d+\.?\d*)(k|m)?/i)
  if (rangeMatch) {
    const lowValue = parseFloat(rangeMatch[1])
    const lowMultiplier = rangeMatch[2] === 'k' ? 1000 : rangeMatch[2] === 'm' ? 1000000 : 1
    return lowValue * lowMultiplier
  }

  // Handle k/m suffixes for single values
  const singleMatch = cleaned.match(/^(\d+\.?\d*)(k|m)?$/)
  if (singleMatch) {
    const value = parseFloat(singleMatch[1])
    const multiplier = singleMatch[2] === 'k' ? 1000 : singleMatch[2] === 'm' ? 1000000 : 1
    return value * multiplier
  }

  return parseFloat(cleaned) || 0
}

/**
 * Get bedroom count from buyer
 */
function getBedrooms(buyer: Buyer): number | null {
  return buyer.bedrooms || buyer.preferred_bedrooms || null
}

/**
 * Check if buyer wants broker connection
 */
function wantsBroker(buyer: Buyer): boolean {
  const ukBroker = buyer.uk_broker?.toString().toLowerCase()
  // If they don't have a broker but might want one, or explicitly want one
  return ukBroker === 'no' || ukBroker === 'unknown' || buyer.connect_to_broker === true
}

/**
 * Check if buyer has broker
 */
function hasBroker(buyer: Buyer): boolean {
  const ukBroker = buyer.uk_broker?.toString().toLowerCase()
  return ukBroker === 'yes' || ukBroker === 'introduced' || ukBroker === 'true'
}

/**
 * Normalize purchase purpose
 */
function getPurchasePurpose(buyer: Buyer): string {
  const purpose = (buyer.purpose || buyer.purchase_purpose || '').toLowerCase()

  if (purpose.includes('primary') || purpose.includes('residence') || purpose.includes('home')) {
    return 'primary_residence'
  }
  if (purpose.includes('dependent') || purpose.includes('studying') || purpose.includes('student')) {
    return 'dependent_studying'
  }
  if (purpose.includes('investment') || purpose.includes('btl') || purpose.includes('buy to let')) {
    return 'investment'
  }
  if (purpose.includes('holiday') || purpose.includes('second') || purpose.includes('vacation')) {
    return 'holiday_home'
  }

  return purpose || 'unknown'
}

/**
 * Check if buyer is ready within 28 days
 */
function is28DayReady(buyer: Buyer): boolean {
  // Direct boolean fields
  if (buyer.ready_in_28_days === true || buyer.ready_within_28_days === true) {
    return true
  }

  // Check timeline for 28-day indicators
  const timeline = (buyer.timeline || buyer.timeline_to_purchase || '').toLowerCase()
  return /28\s*days?|immediate|asap|now|urgent|ready\s*to\s*(buy|purchase)|next\s*week/i.test(timeline)
}

/**
 * Parse timeline to get months
 */
function getTimelineMonths(buyer: Buyer): number | null {
  const timeline = (buyer.timeline || buyer.timeline_to_purchase || '').toLowerCase()

  if (!timeline) return null

  if (/immediate|asap|now|28\s*days?|1\s*month|urgent/i.test(timeline)) {
    return 1
  }
  if (/1-3|2-3|3\s*months?|soon|short/i.test(timeline)) {
    return 3
  }
  if (/3-6|6\s*months?|half\s*year/i.test(timeline)) {
    return 6
  }
  if (/6-12|12\s*months?|year/i.test(timeline)) {
    return 12
  }
  if (/long|flexible|no\s*rush|18|24/i.test(timeline)) {
    return 18
  }

  return null
}

/**
 * Get lead source type
 */
function getSourceType(buyer: Buyer): string {
  const source = (buyer.source || buyer.source_platform || '').toLowerCase()

  if (source.includes('form') || source.includes('website') || source.includes('landing')) {
    return 'form'
  }
  if (source.includes('whatsapp') || source.includes('wa')) {
    return 'whatsapp'
  }
  if (source.includes('email')) {
    return 'email'
  }
  if (source.includes('phone') || source.includes('call')) {
    return 'phone'
  }
  if (source.includes('referral')) {
    return 'referral'
  }

  return source || 'unknown'
}

// ═══════════════════════════════════════════════════════════════════
// FAKE LEAD DETECTION (runs before quality scoring)
// ═══════════════════════════════════════════════════════════════════

const FAKE_PATTERNS = {
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
    /^demo/i,
    /^sample/i,
    /^john\s*doe/i,
    /^jane\s*doe/i,
    /^\s*$/,
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
    /throwaway/i,
    /trash[-_]?mail/i,
    /temp[-_]?mail/i,
    /disposable/i,
    /noreply/i,
    /donotreply/i,
  ],
  phones: [
    /^0{7,}/,
    /^1{7,}/,
    /123456789/,
    /^(\d)\1{6,}/,  // Same digit repeated 7+ times
    /^000/,
    /^999999/,
  ],
}

export function detectFakeLead(buyer: Buyer): FakeLeadCheckResult {
  const flags: string[] = []
  let fakeScore = 0

  const name = buyer.full_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim()
  const email = buyer.email || ''
  const phone = buyer.phone || ''

  // Check name patterns
  for (const pattern of FAKE_PATTERNS.names) {
    if (pattern.test(name)) {
      flags.push(`Suspicious name pattern: "${name}"`)
      fakeScore += 35
      break
    }
  }

  // Check email patterns
  for (const pattern of FAKE_PATTERNS.emails) {
    if (pattern.test(email)) {
      flags.push(`Disposable/fake email: "${email}"`)
      fakeScore += 40
      break
    }
  }

  // Check phone patterns
  const cleanPhone = phone.replace(/\D/g, '')
  for (const pattern of FAKE_PATTERNS.phones) {
    if (pattern.test(cleanPhone)) {
      flags.push(`Suspicious phone number: "${phone}"`)
      fakeScore += 30
      break
    }
  }

  // No contact info at all
  if (!email && !phone) {
    flags.push('No contact information provided')
    fakeScore += 25
  }

  // Very short or missing name
  if (name.length < 3) {
    flags.push('Name too short or missing')
    fakeScore += 20
  }

  // Budget seems unrealistic (too low)
  const budgetNum = parseBudget(buyer.budget || buyer.budget_range || buyer.budget_min)
  if (budgetNum > 0 && budgetNum < 10000) {
    flags.push('Budget unrealistically low for UK property')
    fakeScore += 30
  }

  // Status indicates fake
  const status = (buyer.status || '').toLowerCase()
  if (status.includes('fake') || status.includes('spam') || status.includes("can't verify")) {
    flags.push('Marked as fake/spam')
    fakeScore += 50
  }

  return {
    isFake: fakeScore >= 50,
    flags,
    confidence: Math.min(fakeScore / 100, 1)
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUALITY SCORE (0-100)
// Following the Naybourhood framework hierarchy:
// Financial Proceedability > Commitment Signals > Realism > Engagement
// ═══════════════════════════════════════════════════════════════════

export function calculateQualityScore(buyer: Buyer): QualityScoreResult {
  const breakdown: NaybourhoodScoreBreakdown[] = []
  let total = 0

  // Check for auto-disqualification: £2M+ budget with studio/1-bed
  const budgetNum = parseBudget(buyer.budget || buyer.budget_range || buyer.budget_min)
  const bedrooms = getBedrooms(buyer)

  if (budgetNum >= 2000000 && bedrooms !== null && bedrooms <= 1) {
    return {
      total: 0,
      breakdown: [{
        factor: 'Auto-Disqualification',
        points: -100,
        reason: '£2M+ budget with studio/1-bed preference - mismatch indicates low quality lead'
      }],
      isDisqualified: true,
      disqualificationReason: '£2M+ budget with studio/1-bed preference is unrealistic'
    }
  }

  // === FINANCIAL PROCEEDABILITY (highest priority) ===
  const paymentMethod = (buyer.payment_method || '').toLowerCase()

  // Cash buyer: +30
  if (paymentMethod === 'cash') {
    total += 30
    breakdown.push({
      factor: 'Cash Buyer',
      points: 30,
      reason: 'Cash buyer - highest financial proceedability'
    })
  }
  // Mortgage buyer
  else if (paymentMethod === 'mortgage') {
    // Mortgage + wants broker: +15
    if (wantsBroker(buyer) && !hasBroker(buyer)) {
      total += 15
      breakdown.push({
        factor: 'Mortgage + Wants Broker',
        points: 15,
        reason: 'Mortgage buyer who needs broker connection - opportunity for service'
      })
    }
    // Mortgage + no broker needed (already has one): +20
    else if (hasBroker(buyer)) {
      total += 20
      breakdown.push({
        factor: 'Mortgage + Has Broker',
        points: 20,
        reason: 'Mortgage buyer with broker already connected - ready to proceed'
      })
    }
    // Mortgage with unknown broker status: +10 (partial credit)
    else {
      total += 10
      breakdown.push({
        factor: 'Mortgage Buyer',
        points: 10,
        reason: 'Mortgage buyer - broker status unknown'
      })
    }
  }

  // === COMMITMENT SIGNALS (purchase purpose) ===
  const purpose = getPurchasePurpose(buyer)

  // Primary residence: +15
  if (purpose === 'primary_residence') {
    total += 15
    breakdown.push({
      factor: 'Primary Residence',
      points: 15,
      reason: 'Buying as primary residence - high commitment'
    })
  }
  // Dependent studying: +15
  else if (purpose === 'dependent_studying') {
    total += 15
    breakdown.push({
      factor: 'Dependent Studying',
      points: 15,
      reason: 'Buying for dependent studying - specific need and timeline'
    })
  }
  // Investment: +10
  else if (purpose === 'investment') {
    total += 10
    breakdown.push({
      factor: 'Investment',
      points: 10,
      reason: 'Investment purchase'
    })
  }
  // Holiday/second home: +5
  else if (purpose === 'holiday_home') {
    total += 5
    breakdown.push({
      factor: 'Holiday/Second Home',
      points: 5,
      reason: 'Holiday or second home purchase - lower urgency'
    })
  }

  // === REALISM (complete contact info) ===
  // Complete contact info: +10
  let hasCompleteContact = true
  const contactDetails: string[] = []

  if (buyer.email) contactDetails.push('email')
  if (buyer.phone) contactDetails.push('phone')

  const hasName = !!(buyer.full_name || buyer.first_name)
  if (hasName) contactDetails.push('name')

  if (contactDetails.length >= 2 && hasName) {
    total += 10
    breakdown.push({
      factor: 'Complete Contact Info',
      points: 10,
      reason: `Complete contact information provided: ${contactDetails.join(', ')}`
    })
  } else {
    hasCompleteContact = false
    breakdown.push({
      factor: 'Incomplete Contact Info',
      points: 0,
      reason: `Missing contact information (has: ${contactDetails.join(', ') || 'none'})`
    })
  }

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown,
    isDisqualified: false
  }
}

// ═══════════════════════════════════════════════════════════════════
// INTENT SCORE (0-100)
// 28-day purchase intent is a HARD RULE for auto Hot Lead
// ═══════════════════════════════════════════════════════════════════

export function calculateIntentScore(buyer: Buyer): IntentScoreResult {
  const breakdown: NaybourhoodScoreBreakdown[] = []
  let total = 0
  const is28Day = is28DayReady(buyer)

  // === 28-DAY PURCHASE INTENT (HARD RULE) ===
  if (is28Day) {
    total += 40
    breakdown.push({
      factor: '28-Day Purchase Intent',
      points: 40,
      reason: 'HARD RULE: Ready to purchase within 28 days - automatically qualifies as Hot Lead'
    })
  } else {
    // Check timeline for other durations
    const timelineMonths = getTimelineMonths(buyer)

    if (timelineMonths !== null) {
      // Timeline 3 months: +25
      if (timelineMonths <= 3) {
        total += 25
        breakdown.push({
          factor: 'Timeline 3 Months',
          points: 25,
          reason: 'Looking to purchase within 3 months'
        })
      }
      // Timeline 6+ months: +5
      else if (timelineMonths >= 6) {
        total += 5
        breakdown.push({
          factor: 'Timeline 6+ Months',
          points: 5,
          reason: 'Longer timeline (6+ months)'
        })
      }
    }
  }

  // === PURPOSE-BASED INTENT ===
  const purpose = getPurchasePurpose(buyer)

  // Dependent studying: +25
  if (purpose === 'dependent_studying') {
    total += 25
    breakdown.push({
      factor: 'Dependent Studying',
      points: 25,
      reason: 'Buying for dependent studying - specific timeline requirement'
    })
  }
  // Primary residence: +20
  else if (purpose === 'primary_residence') {
    total += 20
    breakdown.push({
      factor: 'Primary Residence',
      points: 20,
      reason: 'Primary residence purchase - genuine need'
    })
  }
  // Investment: +10
  else if (purpose === 'investment') {
    total += 10
    breakdown.push({
      factor: 'Investment',
      points: 10,
      reason: 'Investment purchase'
    })
  }
  // Holiday/second home: +5
  else if (purpose === 'holiday_home') {
    total += 5
    breakdown.push({
      factor: 'Holiday/Second Home',
      points: 5,
      reason: 'Holiday or second home - less urgent'
    })
  }

  // === COMMITMENT SIGNALS ===
  // Wants broker: +10
  if (wantsBroker(buyer) && !hasBroker(buyer)) {
    total += 10
    breakdown.push({
      factor: 'Wants Broker',
      points: 10,
      reason: 'Actively seeking broker connection - shows intent to proceed'
    })
  }

  // === SOURCE-BASED INTENT ===
  const sourceType = getSourceType(buyer)

  // Source form: +10
  if (sourceType === 'form') {
    total += 10
    breakdown.push({
      factor: 'Source: Form',
      points: 10,
      reason: 'Inquiry via form submission - deliberate action'
    })
  }
  // Source WhatsApp: +5
  else if (sourceType === 'whatsapp') {
    total += 5
    breakdown.push({
      factor: 'Source: WhatsApp',
      points: 5,
      reason: 'WhatsApp inquiry - engaged but informal'
    })
  }

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown,
    is28DayBuyer: is28Day
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONFIDENCE SCORE (0-100)
// Measures data completeness and reliability
// ═══════════════════════════════════════════════════════════════════

export function calculateConfidenceScore(buyer: Buyer): ConfidenceScoreResult {
  const breakdown: NaybourhoodScoreBreakdown[] = []
  let total = 0

  // Core contact fields (40 points max)
  if (buyer.full_name || buyer.first_name) {
    total += 10
    breakdown.push({ factor: 'Name', points: 10, reason: 'Name provided' })
  }
  if (buyer.email) {
    total += 15
    breakdown.push({ factor: 'Email', points: 15, reason: 'Email provided' })
  }
  if (buyer.phone) {
    total += 15
    breakdown.push({ factor: 'Phone', points: 15, reason: 'Phone provided' })
  }

  // Financial info (25 points max)
  if (buyer.budget || buyer.budget_range || buyer.budget_min) {
    total += 10
    breakdown.push({ factor: 'Budget', points: 10, reason: 'Budget specified' })
  }
  if (buyer.payment_method) {
    total += 10
    breakdown.push({ factor: 'Payment Method', points: 10, reason: 'Payment method specified' })
  }
  if (buyer.proof_of_funds) {
    total += 5
    breakdown.push({ factor: 'Proof of Funds', points: 5, reason: 'Proof of funds provided' })
  }

  // Preferences (20 points max)
  if (buyer.timeline || buyer.timeline_to_purchase) {
    total += 10
    breakdown.push({ factor: 'Timeline', points: 10, reason: 'Timeline specified' })
  }
  if (buyer.bedrooms || buyer.preferred_bedrooms) {
    total += 5
    breakdown.push({ factor: 'Bedrooms', points: 5, reason: 'Bedroom preference specified' })
  }
  if (buyer.location || buyer.area) {
    total += 5
    breakdown.push({ factor: 'Location', points: 5, reason: 'Location preference specified' })
  }

  // Source tracking (15 points max)
  if (buyer.source || buyer.source_platform) {
    total += 10
    breakdown.push({ factor: 'Source', points: 10, reason: 'Lead source tracked' })
  }
  if (buyer.purpose || buyer.purchase_purpose) {
    total += 5
    breakdown.push({ factor: 'Purpose', points: 5, reason: 'Purchase purpose specified' })
  }

  return {
    total: Math.min(100, Math.max(0, total)),
    breakdown
  }
}

// ═══════════════════════════════════════════════════════════════════
// CLASSIFICATION
// Hot Lead: 28-day = Yes OR (Quality ≥70 AND Intent ≥70 AND Confidence ≥60)
// Qualified: Quality ≥60 AND Intent ≥50 AND Confidence ≥50
// Needs Qualification: Confidence <50
// Nurture: Intent <50 but Quality ≥50
// Low Priority: Quality <40 or low_urgency flag
// Disqualified: £2M+ budget with studio/1-bed
// ═══════════════════════════════════════════════════════════════════

export function determineClassification(
  qualityScore: QualityScoreResult,
  intentScore: IntentScoreResult,
  confidenceScore: ConfidenceScoreResult,
  fakeCheck: FakeLeadCheckResult,
  lowUrgencyFlag: boolean
): NaybourhoodClassification {
  const quality = qualityScore.total
  const intent = intentScore.total
  const confidence = confidenceScore.total

  // Check for disqualification first
  if (qualityScore.isDisqualified) {
    return 'Disqualified'
  }

  // Fake leads are disqualified
  if (fakeCheck.isFake) {
    return 'Disqualified'
  }

  // HOT LEAD: 28-day = Yes (HARD RULE)
  if (intentScore.is28DayBuyer) {
    return 'Hot Lead'
  }

  // HOT LEAD: Quality ≥70 AND Intent ≥70 AND Confidence ≥60
  if (quality >= 70 && intent >= 70 && confidence >= 60) {
    return 'Hot Lead'
  }

  // LOW PRIORITY: Quality <40 or low_urgency flag
  if (quality < 40 || lowUrgencyFlag) {
    return 'Low Priority'
  }

  // NEEDS QUALIFICATION: Confidence <50
  if (confidence < 50) {
    return 'Needs Qualification'
  }

  // QUALIFIED: Quality ≥60 AND Intent ≥50 AND Confidence ≥50
  if (quality >= 60 && intent >= 50 && confidence >= 50) {
    return 'Qualified'
  }

  // NURTURE: Intent <50 but Quality ≥50
  if (intent < 50 && quality >= 50) {
    return 'Nurture'
  }

  // Default to Needs Qualification if nothing else matches
  return 'Needs Qualification'
}

// ═══════════════════════════════════════════════════════════════════
// CALL PRIORITY
// ═══════════════════════════════════════════════════════════════════

export function determineCallPriority(
  classification: NaybourhoodClassification,
  intentScore: IntentScoreResult
): CallPriority {
  // 28-day buyers get highest priority
  if (intentScore.is28DayBuyer) {
    return {
      level: 1,
      description: '28-Day Buyer - Immediate Priority',
      responseTime: 'Within 1 hour'
    }
  }

  switch (classification) {
    case 'Hot Lead':
      return {
        level: 1,
        description: 'Hot Lead - High Priority',
        responseTime: 'Within 2 hours'
      }
    case 'Qualified':
      return {
        level: 2,
        description: 'Qualified Lead - Same Day',
        responseTime: 'Within 4 hours'
      }
    case 'Needs Qualification':
      return {
        level: 3,
        description: 'Needs Qualification - Prompt Follow-up',
        responseTime: 'Within 24 hours'
      }
    case 'Nurture':
      return {
        level: 4,
        description: 'Nurture Lead - Scheduled Follow-up',
        responseTime: 'Within 48 hours'
      }
    case 'Low Priority':
      return {
        level: 5,
        description: 'Low Priority - When Available',
        responseTime: 'Within 1 week'
      }
    case 'Disqualified':
      return {
        level: 5,
        description: 'Disqualified - No Action Required',
        responseTime: 'N/A'
      }
    default:
      return {
        level: 4,
        description: 'Standard Priority',
        responseTime: 'Within 48 hours'
      }
  }
}

// ═══════════════════════════════════════════════════════════════════
// RISK FLAGS
// ═══════════════════════════════════════════════════════════════════

export function generateRiskFlags(
  buyer: Buyer,
  fakeCheck: FakeLeadCheckResult,
  qualityScore: QualityScoreResult
): string[] {
  const flags: string[] = []

  // Include fake lead flags
  if (fakeCheck.flags.length > 0) {
    flags.push(...fakeCheck.flags.slice(0, 2))
  }

  // Disqualification reason
  if (qualityScore.disqualificationReason) {
    flags.push(qualityScore.disqualificationReason)
  }

  // Financial risk flags
  const paymentMethod = (buyer.payment_method || '').toLowerCase()
  if (paymentMethod === 'mortgage' && !buyer.proof_of_funds) {
    const mortgageStatus = (buyer.mortgage_status || '').toLowerCase()
    if (mortgageStatus !== 'approved' && mortgageStatus !== 'aip') {
      flags.push('Mortgage not yet approved')
    }
  }

  // Missing timeline
  if (!buyer.timeline && !buyer.timeline_to_purchase && !buyer.ready_in_28_days && !buyer.ready_within_28_days) {
    flags.push('Timeline not specified')
  }

  // No broker for mortgage buyer
  if (paymentMethod === 'mortgage' && !hasBroker(buyer)) {
    flags.push('Mortgage buyer without broker')
  }

  // International buyer
  const country = (buyer.country || '').toLowerCase()
  if (country && !['uk', 'united kingdom', 'england', 'scotland', 'wales', 'ni', 'northern ireland'].includes(country)) {
    flags.push('International buyer - may need extended timeline')
  }

  // Stale lead check
  if (buyer.created_at || buyer.date_added) {
    const dateStr = buyer.date_added || buyer.created_at || ''
    const leadDate = new Date(dateStr)
    if (!isNaN(leadDate.getTime())) {
      const daysSinceCreated = Math.floor((Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceCreated > 60) {
        flags.push(`Lead is ${daysSinceCreated} days old`)
      }
    }
  }

  return flags.slice(0, 5)  // Max 5 flags
}

// ═══════════════════════════════════════════════════════════════════
// LOW URGENCY FLAG DETECTION
// ═══════════════════════════════════════════════════════════════════

function detectLowUrgency(buyer: Buyer): boolean {
  const timeline = (buyer.timeline || buyer.timeline_to_purchase || '').toLowerCase()

  // Explicitly long timelines
  if (/no\s*rush|flexible|eventually|someday|long\s*term|18\s*month|24\s*month|2\s*year/i.test(timeline)) {
    return true
  }

  // Holiday home with no specific timeline
  const purpose = getPurchasePurpose(buyer)
  if (purpose === 'holiday_home' && !buyer.timeline && !buyer.timeline_to_purchase) {
    return true
  }

  // Status indicates low urgency
  const status = (buyer.status || '').toLowerCase()
  if (status.includes('not proceeding') || status.includes('cold') || status.includes('lost')) {
    return true
  }

  return false
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCORING FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function scoreLeadNaybourhood(buyer: Buyer): NaybourhoodScoreResult {
  // 1. FAKE LEAD DETECTION (runs first)
  const fakeLeadCheck = detectFakeLead(buyer)

  // 2. LOW URGENCY FLAG
  const lowUrgencyFlag = detectLowUrgency(buyer)

  // 3. QUALITY SCORE
  const qualityScore = calculateQualityScore(buyer)

  // 4. INTENT SCORE
  const intentScore = calculateIntentScore(buyer)

  // 5. CONFIDENCE SCORE
  const confidenceScore = calculateConfidenceScore(buyer)

  // 6. CLASSIFICATION
  const classification = determineClassification(
    qualityScore,
    intentScore,
    confidenceScore,
    fakeLeadCheck,
    lowUrgencyFlag
  )

  // 7. CALL PRIORITY
  const callPriority = determineCallPriority(classification, intentScore)

  // 8. RISK FLAGS
  const riskFlags = generateRiskFlags(buyer, fakeLeadCheck, qualityScore)

  return {
    fakeLeadCheck,
    qualityScore,
    intentScore,
    confidenceScore,
    classification,
    callPriority,
    riskFlags,
    is28DayBuyer: intentScore.is28DayBuyer,
    lowUrgencyFlag
  }
}

// ═══════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY ADAPTER
// Maps new scoring to existing system format
// ═══════════════════════════════════════════════════════════════════

export function convertToLegacyFormat(result: NaybourhoodScoreResult): {
  ai_quality_score: number
  ai_intent_score: number
  ai_confidence: number
  ai_classification: string
  ai_priority: string
  ai_risk_flags: string[]
} {
  // Map classification to legacy format
  const classificationMap: Record<NaybourhoodClassification, string> = {
    'Hot Lead': 'Hot',
    'Qualified': 'Warm-Qualified',
    'Needs Qualification': 'Nurture-Standard',
    'Nurture': 'Nurture-Premium',
    'Low Priority': 'Cold',
    'Disqualified': 'Disqualified'
  }

  // Map priority level to P1-P4
  const priorityMap: Record<number, string> = {
    1: 'P1',
    2: 'P2',
    3: 'P3',
    4: 'P4',
    5: 'P4'
  }

  return {
    ai_quality_score: result.qualityScore.total,
    ai_intent_score: result.intentScore.total,
    ai_confidence: result.confidenceScore.total / 10,  // Convert 0-100 to 0-10
    ai_classification: classificationMap[result.classification] || result.classification,
    ai_priority: priorityMap[result.callPriority.level] || 'P4',
    ai_risk_flags: result.riskFlags
  }
}
