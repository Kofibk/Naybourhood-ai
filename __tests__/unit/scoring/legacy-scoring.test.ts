/**
 * Legacy Scoring System (lib/scoring/index.ts) — Unit Tests
 *
 * Tests the original scoring engine used by POST /api/leads.
 * Covers spam detection, quality, intent, confidence, classification, priority, risk flags.
 */
import { describe, it, expect } from 'vitest'
import {
  scoreLead,
  checkSpam,
  calculateQualityScore,
  calculateIntentScore,
  calculateConfidenceScore,
  determineClassification,
  determinePriority,
  generateRiskFlags,
} from '@/lib/scoring'
import type { Buyer } from '@/types'
import {
  hotLeadCashBuyer,
  qualifiedMortgageBuyer,
  nurtureBuyer,
  lowPriorityBuyer,
  fakeLeadBuyer,
  internationalBuyer,
} from '../../fixtures/buyers'

// ═══════════════════════════════════════════════════════════════
// SPAM DETECTION
// ═══════════════════════════════════════════════════════════════

describe('checkSpam (legacy)', () => {
  it('should detect test names', () => {
    const result = checkSpam({ id: 'x', full_name: 'test user' } as Buyer)
    expect(result.flags.some(f => f.includes('name'))).toBe(true)
  })

  it('should detect suspicious emails', () => {
    const result = checkSpam({ id: 'x', email: 'user@mailinator.com' } as Buyer)
    expect(result.flags.some(f => f.includes('email'))).toBe(true)
  })

  it('should detect suspicious phone numbers', () => {
    const result = checkSpam({ id: 'x', full_name: 'Real', phone: '1111111111' } as Buyer)
    expect(result.flags.some(f => f.includes('phone'))).toBe(true)
  })

  it('should mark combined fake signals as spam', () => {
    const result = checkSpam(fakeLeadBuyer)
    expect(result.isSpam).toBe(true)
  })

  it('should NOT mark legitimate buyers as spam', () => {
    const result = checkSpam(hotLeadCashBuyer)
    expect(result.isSpam).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// QUALITY SCORE (legacy)
// ═══════════════════════════════════════════════════════════════

describe('calculateQualityScore (legacy)', () => {
  it('should score cash buyers higher than mortgage buyers', () => {
    const cashScore = calculateQualityScore(hotLeadCashBuyer)
    const mortgageScore = calculateQualityScore(qualifiedMortgageBuyer)
    expect(cashScore.total).toBeGreaterThanOrEqual(mortgageScore.total)
  })

  it('should include profile completeness, financial, verification, fit', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    expect(result.breakdown).toHaveProperty('profileCompleteness')
    expect(result.breakdown).toHaveProperty('financialQualification')
    expect(result.breakdown).toHaveProperty('verificationStatus')
    expect(result.breakdown).toHaveProperty('inventoryFit')
  })

  it('should give points for complete profiles', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    expect(result.breakdown.profileCompleteness.score).toBeGreaterThan(0)
  })

  it('should give cash buyers max financial points', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    expect(result.breakdown.financialQualification.score).toBeGreaterThan(10)
  })

  it('should give points for UK solicitor', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    expect(result.breakdown.verificationStatus.score).toBeGreaterThan(0)
  })

  it('should return 0-100 range', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════
// INTENT SCORE (legacy)
// ═══════════════════════════════════════════════════════════════

describe('calculateIntentScore (legacy)', () => {
  it('should give max timeline points for ASAP', () => {
    const result = calculateIntentScore(hotLeadCashBuyer)
    expect(result.breakdown.timeline.score).toBe(30)
  })

  it('should give 20 for 1-3 month timeline', () => {
    const result = calculateIntentScore(qualifiedMortgageBuyer)
    expect(result.breakdown.timeline.score).toBe(20)
  })

  it('should give cash buyer high purpose score', () => {
    const result = calculateIntentScore(hotLeadCashBuyer)
    expect(result.breakdown.purpose.score).toBeGreaterThan(10)
  })

  it('should deduct for "not proceeding" status', () => {
    const buyer: Buyer = { ...nurtureBuyer, status: 'Not Proceeding' }
    const result = calculateIntentScore(buyer)
    expect(result.breakdown.negativeModifiers.score).toBeLessThan(0)
  })

  it('should return 0-100 range', () => {
    const result = calculateIntentScore(hotLeadCashBuyer)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE SCORE (legacy, 0-10)
// ═══════════════════════════════════════════════════════════════

describe('calculateConfidenceScore (legacy)', () => {
  it('should return 0-10 range', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(10)
  })

  it('should score higher for complete data', () => {
    const complete = calculateConfidenceScore(hotLeadCashBuyer)
    const minimal = calculateConfidenceScore(lowPriorityBuyer)
    expect(complete.total).toBeGreaterThan(minimal.total)
  })

  it('should include data completeness, verification, engagement, transcript', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    expect(result.breakdown).toHaveProperty('dataCompleteness')
    expect(result.breakdown).toHaveProperty('verificationLevel')
    expect(result.breakdown).toHaveProperty('engagementData')
    expect(result.breakdown).toHaveProperty('transcriptQuality')
  })
})

// ═══════════════════════════════════════════════════════════════
// CLASSIFICATION (legacy)
// ═══════════════════════════════════════════════════════════════

describe('determineClassification (legacy)', () => {
  it('should classify spam as Spam', () => {
    const spamCheck = checkSpam(fakeLeadBuyer)
    const result = determineClassification(50, 50, 5, spamCheck)
    expect(result).toBe('Spam')
  })

  it('should classify high quality + high intent as Hot', () => {
    const spamCheck = checkSpam(hotLeadCashBuyer)
    const result = determineClassification(75, 75, 8, spamCheck)
    expect(result).toBe('Hot')
  })

  it('should classify very low scores as Disqualified', () => {
    const spamCheck = { isSpam: false, flags: [], confidence: 0 }
    const result = determineClassification(10, 10, 2, spamCheck)
    expect(result).toBe('Disqualified')
  })

  it('should classify high quality + moderate intent as Warm-Qualified', () => {
    const spamCheck = { isSpam: false, flags: [], confidence: 0 }
    const result = determineClassification(75, 50, 6, spamCheck)
    expect(result).toBe('Warm-Qualified')
  })

  it('should classify moderate quality + high intent as Warm-Engaged', () => {
    const spamCheck = { isSpam: false, flags: [], confidence: 0 }
    const result = determineClassification(50, 75, 6, spamCheck)
    expect(result).toBe('Warm-Engaged')
  })

  it('should classify average scores as Nurture', () => {
    const spamCheck = { isSpam: false, flags: [], confidence: 0 }
    const result = determineClassification(55, 50, 5, spamCheck)
    expect(result).toBe('Nurture-Premium')
  })

  it('should classify low scores as Cold', () => {
    const spamCheck = { isSpam: false, flags: [], confidence: 0 }
    const result = determineClassification(25, 25, 3, spamCheck)
    expect(result).toBe('Cold')
  })
})

// ═══════════════════════════════════════════════════════════════
// PRIORITY (legacy)
// ═══════════════════════════════════════════════════════════════

describe('determinePriority (legacy)', () => {
  it('should give Hot leads P1', () => {
    const result = determinePriority('Hot', 80, 80)
    expect(result.priority).toBe('P1')
    expect(result.responseTime).toContain('1 hour')
  })

  it('should give Warm leads P2', () => {
    const result = determinePriority('Warm-Qualified', 70, 50)
    expect(result.priority).toBe('P2')
  })

  it('should give Nurture leads P3', () => {
    const result = determinePriority('Nurture-Standard', 40, 40)
    expect(result.priority).toBe('P3')
  })

  it('should give Cold/Disqualified P4', () => {
    const result = determinePriority('Cold', 20, 20)
    expect(result.priority).toBe('P4')
  })
})

// ═══════════════════════════════════════════════════════════════
// RISK FLAGS (legacy)
// ═══════════════════════════════════════════════════════════════

describe('generateRiskFlags (legacy)', () => {
  it('should flag mortgage buyer without approval', () => {
    const buyer: Buyer = { ...qualifiedMortgageBuyer, mortgage_status: undefined }
    const scores = scoreLead(buyer)
    const flags = generateRiskFlags(buyer, {
      quality: scores.qualityScore,
      intent: scores.intentScore,
      confidence: scores.confidenceScore,
      spamCheck: scores.spamCheck,
    })
    expect(flags.some(f => f.includes('Mortgage'))).toBe(true)
  })

  it('should flag international buyers', () => {
    const scores = scoreLead(internationalBuyer)
    const flags = generateRiskFlags(internationalBuyer, {
      quality: scores.qualityScore,
      intent: scores.intentScore,
      confidence: scores.confidenceScore,
      spamCheck: scores.spamCheck,
    })
    expect(flags.some(f => f.includes('International'))).toBe(true)
  })

  it('should flag missing timeline', () => {
    const buyer: Buyer = { id: 'x', full_name: 'No Timeline', email: 'a@b.com' } as Buyer
    const scores = scoreLead(buyer)
    const flags = generateRiskFlags(buyer, {
      quality: scores.qualityScore,
      intent: scores.intentScore,
      confidence: scores.confidenceScore,
      spamCheck: scores.spamCheck,
    })
    expect(flags.some(f => f.includes('Timeline'))).toBe(true)
  })

  it('should limit to max 5 flags', () => {
    const scores = scoreLead(fakeLeadBuyer)
    const flags = generateRiskFlags(fakeLeadBuyer, {
      quality: scores.qualityScore,
      intent: scores.intentScore,
      confidence: scores.confidenceScore,
      spamCheck: scores.spamCheck,
    })
    expect(flags.length).toBeLessThanOrEqual(5)
  })
})

// ═══════════════════════════════════════════════════════════════
// MAIN scoreLead FUNCTION
// ═══════════════════════════════════════════════════════════════

describe('scoreLead (legacy)', () => {
  it('should return all required fields', () => {
    const result = scoreLead(hotLeadCashBuyer)
    expect(result).toHaveProperty('spamCheck')
    expect(result).toHaveProperty('qualityScore')
    expect(result).toHaveProperty('intentScore')
    expect(result).toHaveProperty('confidenceScore')
    expect(result).toHaveProperty('classification')
    expect(result).toHaveProperty('priority')
    expect(result).toHaveProperty('riskFlags')
  })

  it('should score hot lead highly', () => {
    const result = scoreLead(hotLeadCashBuyer)
    expect(result.qualityScore.total).toBeGreaterThanOrEqual(50)
    expect(result.intentScore.total).toBeGreaterThanOrEqual(50)
    expect(result.classification).toBe('Hot')
    expect(result.priority.priority).toBe('P1')
  })

  it('should detect fake/spam leads', () => {
    const result = scoreLead(fakeLeadBuyer)
    expect(result.spamCheck.isSpam).toBe(true)
    expect(result.classification).toBe('Spam')
    expect(result.priority.priority).toBe('P4')
  })

  it('should score international buyer correctly', () => {
    const result = scoreLead(internationalBuyer)
    expect(result.spamCheck.isSpam).toBe(false)
    expect(result.qualityScore.total).toBeGreaterThan(30)
  })
})
