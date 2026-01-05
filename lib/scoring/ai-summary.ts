/**
 * AI Summary Generation for Lead Scoring
 *
 * Generates:
 * - Buyer summary (2-3 sentences)
 * - Next recommended action
 * - Recommendations list
 * - Risk assessment
 */

import type { Buyer } from '@/types'
import type { LeadScoreResult, Classification, Priority } from './index'

export interface AISummaryResult {
  summary: string
  nextAction: string
  recommendations: string[]
}

// ═══════════════════════════════════════════════════════════════════
// NEXT ACTION DETERMINATION
// ═══════════════════════════════════════════════════════════════════

export function determineNextAction(
  buyer: Buyer,
  scores: LeadScoreResult
): string {
  const { classification, priority, qualityScore, intentScore } = scores
  const status = (buyer.status || '').toLowerCase()

  // Spam - flag and review
  if (classification === 'Spam') {
    return 'Review and verify lead authenticity before proceeding'
  }

  // Disqualified - archive
  if (classification === 'Disqualified') {
    return 'Archive lead - does not meet minimum qualification criteria'
  }

  // Hot leads - immediate action based on status
  if (classification === 'Hot') {
    if (!buyer.phone && !buyer.email) {
      return 'Obtain contact details through original source'
    }
    if (status.includes('viewing booked')) {
      return 'Confirm viewing and prepare property presentation'
    }
    if (status.includes('negotiating')) {
      return 'Follow up on offer status and address objections'
    }
    if (!buyer.proof_of_funds) {
      return 'Request proof of funds to progress to viewing stage'
    }
    return 'Call within 1 hour to book viewing'
  }

  // Warm-Qualified - focus on financial verification
  if (classification === 'Warm-Qualified') {
    if (!buyer.proof_of_funds && buyer.payment_method?.toLowerCase() === 'cash') {
      return 'Request proof of funds to confirm cash buyer status'
    }
    if (buyer.payment_method?.toLowerCase() === 'mortgage' &&
        !['approved', 'aip'].includes((buyer.mortgage_status || '').toLowerCase())) {
      return 'Recommend mortgage broker and request AIP within 5 days'
    }
    if (!buyer.uk_solicitor) {
      return 'Introduce to panel solicitor to prepare for exchange'
    }
    return 'Schedule discovery call to confirm timeline and preferences'
  }

  // Warm-Engaged - nurture the intent
  if (classification === 'Warm-Engaged') {
    if (!buyer.timeline) {
      return 'Clarify purchase timeline and urgency'
    }
    if (!(buyer.bedrooms || buyer.preferred_bedrooms)) {
      return 'Qualify property requirements - bedrooms, location, features'
    }
    return 'Send personalized property recommendations to maintain engagement'
  }

  // Nurture leads - educational approach
  if (classification === 'Nurture-Premium') {
    if (qualityScore.total > intentScore.total) {
      return 'Re-engage with market update and new property listings'
    }
    return 'Add to nurture sequence with educational content about buying process'
  }

  if (classification === 'Nurture-Standard') {
    return 'Add to automated email nurture sequence'
  }

  // Cold leads
  return 'Low priority - add to long-term nurture campaign'
}

// ═══════════════════════════════════════════════════════════════════
// RECOMMENDATIONS GENERATION
// ═══════════════════════════════════════════════════════════════════

export function generateRecommendations(
  buyer: Buyer,
  scores: LeadScoreResult
): string[] {
  const recommendations: string[] = []
  const { classification, qualityScore, intentScore, riskFlags } = scores

  // Skip for spam/disqualified
  if (classification === 'Spam' || classification === 'Disqualified') {
    return ['Review lead data for accuracy', 'Consider removing from active pipeline']
  }

  // Financial recommendations
  if (!buyer.proof_of_funds) {
    recommendations.push('Request proof of funds or bank statement')
  }

  if (buyer.payment_method?.toLowerCase() === 'mortgage') {
    if (!['approved', 'aip'].includes((buyer.mortgage_status || '').toLowerCase())) {
      recommendations.push('Connect with mortgage advisor for AIP')
    }
    if (!buyer.uk_broker) {
      recommendations.push('Introduce to partner mortgage broker')
    }
  }

  // Legal preparation
  if (!buyer.uk_solicitor && qualityScore.total >= 50) {
    recommendations.push('Recommend panel solicitor early in process')
  }

  // Property matching
  const location = buyer.location || buyer.area
  const bedrooms = buyer.bedrooms || buyer.preferred_bedrooms
  if (location && bedrooms) {
    recommendations.push(`Prepare ${bedrooms}-bed options in ${location}`)
  } else if (location) {
    recommendations.push(`Curate properties in ${location} matching budget`)
  }

  // International buyers
  const country = (buyer.country || '').toLowerCase()
  if (country && !['uk', 'united kingdom', 'england', 'scotland', 'wales'].includes(country)) {
    recommendations.push('Discuss currency exchange and international payment options')
    recommendations.push('Clarify UK purchase process for overseas buyers')
  }

  // High-value buyers
  const budget = buyer.budget || buyer.budget_range || ''
  if (/1m|1,000|million/i.test(budget)) {
    recommendations.push('Offer exclusive/off-market property access')
  }

  // Intent boosting for warm leads
  if (intentScore.total < 50 && qualityScore.total >= 60) {
    recommendations.push('Schedule discovery call to understand timeline')
  }

  // Quality improvement for engaged leads
  if (qualityScore.total < 50 && intentScore.total >= 60) {
    recommendations.push('Complete buyer profile with missing information')
  }

  // Viewing-related
  const status = (buyer.status || '').toLowerCase()
  if (status.includes('viewing booked')) {
    recommendations.push('Send viewing confirmation with development details')
    recommendations.push('Prepare comparable market analysis')
  }

  // Timeline-based
  if (!buyer.timeline) {
    recommendations.push('Clarify purchase timeline in next conversation')
  }

  return recommendations.slice(0, 5)  // Max 5 recommendations
}

// ═══════════════════════════════════════════════════════════════════
// AI SUMMARY GENERATION
// ═══════════════════════════════════════════════════════════════════

export function generateBuyerSummary(
  buyer: Buyer,
  scores: LeadScoreResult
): string {
  const { classification, priority, qualityScore, intentScore, confidenceScore, riskFlags } = scores

  const name = buyer.full_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'This lead'
  const budget = buyer.budget || buyer.budget_range || 'unspecified budget'
  const paymentMethod = buyer.payment_method || 'unknown payment method'
  const location = buyer.location || buyer.area || 'unspecified location'
  const timeline = buyer.timeline || 'unspecified timeline'
  const country = buyer.country || ''

  // Build classification description
  const classificationDescriptions: Record<Classification, string> = {
    'Hot': 'high-priority',
    'Warm-Qualified': 'financially qualified',
    'Warm-Engaged': 'actively engaged',
    'Nurture-Premium': 'promising',
    'Nurture-Standard': 'developing',
    'Cold': 'early-stage',
    'Disqualified': 'unqualified',
    'Spam': 'suspected spam'
  }

  const classDesc = classificationDescriptions[classification]

  // Payment/financial status
  let financialStatus = ''
  if (paymentMethod.toLowerCase() === 'cash') {
    if (buyer.proof_of_funds) {
      financialStatus = 'verified cash buyer'
    } else {
      financialStatus = 'cash buyer (unverified)'
    }
  } else if (paymentMethod.toLowerCase() === 'mortgage') {
    const mortgageStatus = buyer.mortgage_status?.toLowerCase()
    if (mortgageStatus === 'approved' || mortgageStatus === 'aip') {
      financialStatus = 'mortgage buyer with AIP'
    } else {
      financialStatus = 'mortgage buyer (pending approval)'
    }
  } else {
    financialStatus = `${paymentMethod} buyer`
  }

  // Location context
  const locationContext = country && !['uk', 'united kingdom'].includes(country.toLowerCase())
    ? `based in ${country}, interested in ${location}`
    : `looking in ${location}`

  // Build sentences
  const sentence1 = `${name} is a ${classDesc} ${financialStatus} ${locationContext}.`

  const sentence2 = `Budget: ${budget}. Timeline: ${timeline}.`

  // Risk/opportunity sentence
  let sentence3 = ''
  if (classification === 'Hot' || classification === 'Warm-Qualified') {
    const status = buyer.status || 'Contact Pending'
    sentence3 = `Currently at "${status}" stage. Priority: ${priority.priority} (${priority.responseTime} response time).`
  } else if (riskFlags.length > 0) {
    sentence3 = `Note: ${riskFlags[0]}.`
  } else if (confidenceScore.total < 5) {
    sentence3 = `Limited data available - confidence: ${confidenceScore.total}/10.`
  } else {
    sentence3 = `Quality: ${qualityScore.total}/100, Intent: ${intentScore.total}/100.`
  }

  return `${sentence1} ${sentence2} ${sentence3}`
}

// ═══════════════════════════════════════════════════════════════════
// MAIN AI SUMMARY FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function generateAISummary(
  buyer: Buyer,
  scores: LeadScoreResult
): AISummaryResult {
  const summary = generateBuyerSummary(buyer, scores)
  const nextAction = determineNextAction(buyer, scores)
  const recommendations = generateRecommendations(buyer, scores)

  return {
    summary,
    nextAction,
    recommendations
  }
}

// ═══════════════════════════════════════════════════════════════════
// ANTHROPIC API INTEGRATION (Optional Enhancement)
// ═══════════════════════════════════════════════════════════════════

export async function generateAISummaryWithLLM(
  buyer: Buyer,
  scores: LeadScoreResult
): Promise<AISummaryResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  // If no API key, use rule-based generation
  if (!apiKey) {
    return generateAISummary(buyer, scores)
  }

  try {
    const prompt = buildLLMPrompt(buyer, scores)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      console.error('[AI Summary] API error:', response.status)
      return generateAISummary(buyer, scores)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text

    if (!content) {
      return generateAISummary(buyer, scores)
    }

    // Parse LLM response
    return parseLLMResponse(content, buyer, scores)
  } catch (error) {
    console.error('[AI Summary] Error calling LLM:', error)
    return generateAISummary(buyer, scores)
  }
}

function buildLLMPrompt(buyer: Buyer, scores: LeadScoreResult): string {
  const { classification, priority, qualityScore, intentScore, confidenceScore, riskFlags } = scores

  return `You are a real estate CRM assistant. Generate a brief buyer summary, next action, and recommendations.

BUYER DATA:
- Name: ${buyer.full_name || buyer.first_name || 'Unknown'}
- Email: ${buyer.email || 'Not provided'}
- Phone: ${buyer.phone || 'Not provided'}
- Country: ${buyer.country || 'Not specified'}
- Budget: ${buyer.budget || buyer.budget_range || 'Not specified'}
- Payment: ${buyer.payment_method || 'Unknown'}
- Mortgage Status: ${buyer.mortgage_status || 'N/A'}
- Timeline: ${buyer.timeline || 'Not specified'}
- Location Preference: ${buyer.location || buyer.area || 'Not specified'}
- Bedrooms: ${buyer.bedrooms || buyer.preferred_bedrooms || 'Not specified'}
- Status: ${buyer.status || 'New'}
- Proof of Funds: ${buyer.proof_of_funds ? 'Yes' : 'No'}
- UK Broker: ${buyer.uk_broker ? 'Yes' : 'No'}
- UK Solicitor: ${buyer.uk_solicitor ? 'Yes' : 'No'}

SCORES:
- Classification: ${classification}
- Priority: ${priority.priority} (${priority.responseTime})
- Quality Score: ${qualityScore.total}/100
- Intent Score: ${intentScore.total}/100
- Confidence: ${confidenceScore.total}/10
- Risk Flags: ${riskFlags.join(', ') || 'None'}

Respond in JSON format:
{
  "summary": "2-3 sentence buyer summary",
  "nextAction": "Single specific next action",
  "recommendations": ["rec1", "rec2", "rec3"]
}

Keep the summary professional and actionable. Focus on what makes this lead valuable or concerning.`
}

function parseLLMResponse(
  content: string,
  buyer: Buyer,
  scores: LeadScoreResult
): AISummaryResult {
  try {
    // Try to parse JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        summary: parsed.summary || generateBuyerSummary(buyer, scores),
        nextAction: parsed.nextAction || determineNextAction(buyer, scores),
        recommendations: Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : generateRecommendations(buyer, scores)
      }
    }
  } catch (e) {
    console.error('[AI Summary] Failed to parse LLM response')
  }

  // Fallback to rule-based
  return generateAISummary(buyer, scores)
}
