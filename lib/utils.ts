import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Case-insensitive status comparison
export function statusIs(status: string | undefined | null, target: string): boolean {
  if (!status) return false
  return status.toLowerCase() === target.toLowerCase()
}

// Check if status is in a list (case-insensitive)
export function statusIsAnyOf(status: string | undefined | null, targets: string[]): boolean {
  if (!status) return false
  const statusLower = status.toLowerCase()
  return targets.some(t => t.toLowerCase() === statusLower)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function getDateString(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-GB').format(num)
}

// Format price as £xxxK or £x.xM for compact display
export function formatPriceShort(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '?'

  // If it's already formatted with £ and K/M, return as-is
  if (typeof value === 'string') {
    const upperVal = value.toUpperCase()
    if (upperVal.includes('K') || upperVal.includes('M')) {
      // Already formatted, just clean it up
      return value.startsWith('£') ? value : `£${value}`
    }
  }

  // Parse numeric value from string or number
  let numValue: number
  if (typeof value === 'string') {
    // Remove £, commas, spaces
    const cleaned = value.replace(/[£,\s]/g, '')
    numValue = parseFloat(cleaned)
  } else {
    numValue = value
  }

  if (isNaN(numValue) || numValue === 0) return '?'

  // Format as K or M
  if (numValue >= 1000000) {
    const millions = numValue / 1000000
    // Show one decimal if not a whole number
    return millions % 1 === 0
      ? `£${millions}M`
      : `£${millions.toFixed(1)}M`
  } else if (numValue >= 1000) {
    const thousands = Math.round(numValue / 1000)
    return `£${thousands}K`
  } else {
    return `£${Math.round(numValue)}`
  }
}

// Format a price range as "£xxxK - £xxxK" or "£x.xM - £x.xM"
export function formatPriceRange(from: string | number | null | undefined, to: string | number | null | undefined): string {
  const formattedFrom = formatPriceShort(from)
  const formattedTo = formatPriceShort(to)

  if (formattedFrom === '?' && formattedTo === '?') return ''
  if (formattedFrom === '?') return `Up to ${formattedTo}`
  if (formattedTo === '?') return `From ${formattedFrom}`

  return `${formattedFrom} - ${formattedTo}`
}

// Heuristic-based instant lead scoring
// Provides immediate scores while AI processing runs in background
export interface HeuristicScoreResult {
  score: number
  classification: 'Hot' | 'Warm-Qualified' | 'Warm-Engaged' | 'Nurture' | 'Cold'
  confidence: number
}

export function calculateHeuristicScore(lead: {
  budget?: string | null
  budget_range?: string | null
  budget_min?: number | null
  budget_max?: number | null
  timeline?: string | null
  payment_method?: string | null
  proof_of_funds?: boolean | null
  email?: string | null
  phone?: string | null
  status?: string | null
}): HeuristicScoreResult {
  let score = 30 // Conservative base score - leads need to earn higher scores

  // Budget scoring (0-25 points)
  const budgetStr = (lead.budget || lead.budget_range || '').toLowerCase()
  const budgetMax = lead.budget_max || 0
  if (budgetStr.includes('10') || budgetStr.includes('million') || budgetMax >= 10000000) {
    score += 25
  } else if (budgetStr.includes('7') || budgetStr.includes('5') || budgetMax >= 5000000) {
    score += 20
  } else if (budgetStr.includes('3') || budgetStr.includes('4') || budgetMax >= 3000000) {
    score += 15
  } else if (budgetStr.includes('2') || budgetStr.includes('1') || budgetMax >= 1000000) {
    score += 10
  } else if (budgetStr) {
    score += 5
  }

  // Timeline scoring (0-20 points)
  const timelineStr = (lead.timeline || '').toLowerCase()
  if (timelineStr.includes('immediate') || timelineStr.includes('asap') || timelineStr.includes('now')) {
    score += 20
  } else if (timelineStr.includes('1') || timelineStr.includes('3 month') || timelineStr.includes('soon')) {
    score += 15
  } else if (timelineStr.includes('6 month') || timelineStr.includes('this year')) {
    score += 10
  } else if (timelineStr.includes('12') || timelineStr.includes('next year')) {
    score += 5
  }

  // Payment method (0-15 points)
  const paymentStr = (lead.payment_method || '').toLowerCase()
  if (paymentStr.includes('cash')) {
    score += 15
  } else if (paymentStr.includes('mortgage')) {
    score += 8
  }

  // Proof of funds bonus (0-10 points)
  if (lead.proof_of_funds) {
    score += 10
  }

  // Contact completeness (0-5 points)
  if (lead.email && lead.phone) {
    score += 5
  } else if (lead.email || lead.phone) {
    score += 2
  }

  // Status adjustments - significant impact
  const statusStr = (lead.status || '').toLowerCase()
  if (statusStr.includes('reserved') || statusStr.includes('exchanged')) {
    score += 20  // Committed stage
  } else if (statusStr.includes('viewing') || statusStr.includes('offer')) {
    score += 15  // Active engagement
  } else if (statusStr.includes('negotiat')) {
    score += 12
  } else if (statusStr.includes('qualified') || statusStr.includes('interested')) {
    score += 8
  } else if (statusStr.includes('contact pending') || statusStr.includes('new')) {
    score += 0  // Neutral - needs contact
  } else if (statusStr.includes('fake') || statusStr.includes('duplicate') || statusStr.includes('not proceed')) {
    score -= 40  // Heavy penalty
  }

  // Cap score between 0-100
  score = Math.max(0, Math.min(100, score))

  // Determine classification based on score
  let classification: HeuristicScoreResult['classification']
  if (score >= 75) {
    classification = 'Hot'
  } else if (score >= 60) {
    classification = 'Warm-Qualified'
  } else if (score >= 45) {
    classification = 'Warm-Engaged'
  } else if (score >= 30) {
    classification = 'Nurture'
  } else {
    classification = 'Cold'
  }

  // Confidence based on data completeness (how much data we had to score with)
  let dataPoints = 0
  if (lead.budget || lead.budget_range || lead.budget_max) dataPoints++
  if (lead.timeline) dataPoints++
  if (lead.payment_method) dataPoints++
  if (lead.email) dataPoints++
  if (lead.phone) dataPoints++
  const confidence = Math.min(100, 30 + (dataPoints * 14)) // 30-100% based on data

  return { score, classification, confidence }
}
