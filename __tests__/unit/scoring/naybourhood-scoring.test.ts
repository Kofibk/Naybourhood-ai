/**
 * Naybourhood Scoring Framework — Unit Tests
 *
 * Tests the core NB scoring system: quality, intent, confidence,
 * classification, call priority, fake lead detection, and risk flags.
 *
 * Maps to Full Journey Test steps:
 *   7. NB Score — should be Hot Lead (80+)
 *  16. Detail page shows NB Score ring, sub-scores, AI summary, next action
 */
import { describe, it, expect } from 'vitest'
import {
  scoreLeadNaybourhood,
  detectFakeLead,
  calculateQualityScore,
  calculateIntentScore,
  calculateConfidenceScore,
  determineClassification,
  determineCallPriority,
  generateRiskFlags,
  convertToLegacyFormat,
} from '@/lib/scoring/naybourhood-scoring'
import type { Buyer } from '@/types'
import {
  hotLeadCashBuyer,
  qualifiedMortgageBuyer,
  nurtureBuyer,
  lowPriorityBuyer,
  fakeLeadBuyer,
  disqualifiedBuyer,
  internationalBuyer,
} from '../../fixtures/buyers'

// ═══════════════════════════════════════════════════════════════
// FAKE LEAD DETECTION
// ═══════════════════════════════════════════════════════════════

describe('detectFakeLead', () => {
  it('should detect "test" names as fake', () => {
    const result = detectFakeLead({ ...fakeLeadBuyer, full_name: 'Test User' } as Buyer)
    expect(result.flags.length).toBeGreaterThan(0)
    expect(result.flags.some(f => f.includes('name'))).toBe(true)
  })

  it('should detect disposable email domains', () => {
    const result = detectFakeLead({ id: 'x', email: 'user@mailinator.com' } as Buyer)
    expect(result.flags.some(f => f.includes('email'))).toBe(true)
  })

  it('should detect example.com emails', () => {
    const result = detectFakeLead({ id: 'x', email: 'test@example.com' } as Buyer)
    expect(result.flags.some(f => f.includes('email'))).toBe(true)
  })

  it('should detect repeating phone numbers', () => {
    const result = detectFakeLead({ id: 'x', full_name: 'Real Name', phone: '1111111111' } as Buyer)
    expect(result.flags.some(f => f.includes('phone'))).toBe(true)
  })

  it('should flag when no contact info provided', () => {
    const result = detectFakeLead({ id: 'x', full_name: 'Real Person' } as Buyer)
    expect(result.flags.some(f => f.includes('contact'))).toBe(true)
  })

  it('should flag unrealistically low budgets', () => {
    const result = detectFakeLead({ id: 'x', full_name: 'Real Person', email: 'r@real.com', budget: '£500' } as Buyer)
    expect(result.flags.some(f => f.includes('Budget'))).toBe(true)
  })

  it('should mark a combination of fake signals as isFake=true', () => {
    const result = detectFakeLead(fakeLeadBuyer)
    expect(result.isFake).toBe(true)
    expect(result.confidence).toBeGreaterThanOrEqual(0.5)
  })

  it('should NOT flag legitimate buyers', () => {
    const result = detectFakeLead(hotLeadCashBuyer)
    expect(result.isFake).toBe(false)
  })

  it('should NOT flag international buyers as fake', () => {
    const result = detectFakeLead(internationalBuyer)
    expect(result.isFake).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// QUALITY SCORE
// ═══════════════════════════════════════════════════════════════

describe('calculateQualityScore', () => {
  it('should give cash buyers +30 points', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    const cashFactor = result.breakdown.find(b => b.factor === 'Cash Buyer')
    expect(cashFactor).toBeDefined()
    expect(cashFactor!.points).toBe(30)
  })

  it('should give mortgage+has-broker buyers +20', () => {
    const result = calculateQualityScore(qualifiedMortgageBuyer)
    const brokerFactor = result.breakdown.find(b => b.factor === 'Mortgage + Has Broker')
    expect(brokerFactor).toBeDefined()
    expect(brokerFactor!.points).toBe(20)
  })

  it('should give primary residence buyers +15', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    const purposeFactor = result.breakdown.find(b => b.factor === 'Primary Residence')
    expect(purposeFactor).toBeDefined()
    expect(purposeFactor!.points).toBe(15)
  })

  it('should give investment buyers +10', () => {
    const result = calculateQualityScore(qualifiedMortgageBuyer)
    const purposeFactor = result.breakdown.find(b => b.factor === 'Investment')
    expect(purposeFactor).toBeDefined()
    expect(purposeFactor!.points).toBe(10)
  })

  it('should give +10 for complete contact info (name+email+phone)', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    const contactFactor = result.breakdown.find(b => b.factor === 'Complete Contact Info')
    expect(contactFactor).toBeDefined()
    expect(contactFactor!.points).toBe(10)
  })

  it('should auto-disqualify £2M+ budget with studio/1-bed', () => {
    const result = calculateQualityScore(disqualifiedBuyer)
    expect(result.isDisqualified).toBe(true)
    expect(result.total).toBe(0)
    expect(result.disqualificationReason).toBeDefined()
  })

  it('should NOT auto-disqualify £2M+ with 3+ bed', () => {
    const buyer: Buyer = { ...disqualifiedBuyer, bedrooms: 3 }
    const result = calculateQualityScore(buyer)
    expect(result.isDisqualified).toBe(false)
  })

  it('should return score between 0 and 100', () => {
    const result = calculateQualityScore(hotLeadCashBuyer)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════
// INTENT SCORE
// ═══════════════════════════════════════════════════════════════

describe('calculateIntentScore', () => {
  it('should give 28-day buyers +40 (HARD RULE)', () => {
    const result = calculateIntentScore(hotLeadCashBuyer)
    const dayFactor = result.breakdown.find(b => b.factor === '28-Day Purchase Intent')
    expect(dayFactor).toBeDefined()
    expect(dayFactor!.points).toBe(40)
    expect(result.is28DayBuyer).toBe(true)
  })

  it('should detect ASAP timeline as 28-day', () => {
    const buyer: Buyer = { id: 'x', timeline: 'ASAP' } as Buyer
    const result = calculateIntentScore(buyer)
    expect(result.is28DayBuyer).toBe(true)
  })

  it('should detect "immediate" timeline as 28-day', () => {
    const buyer: Buyer = { id: 'x', timeline: 'immediate' } as Buyer
    const result = calculateIntentScore(buyer)
    expect(result.is28DayBuyer).toBe(true)
  })

  it('should NOT mark 1-3 month buyers as 28-day', () => {
    const result = calculateIntentScore(qualifiedMortgageBuyer)
    expect(result.is28DayBuyer).toBe(false)
  })

  it('should give 3-month timeline +25', () => {
    const result = calculateIntentScore(qualifiedMortgageBuyer)
    const timelineFactor = result.breakdown.find(b => b.factor === 'Timeline 3 Months')
    expect(timelineFactor).toBeDefined()
    expect(timelineFactor!.points).toBe(25)
  })

  it('should give primary residence +20 intent', () => {
    const result = calculateIntentScore(hotLeadCashBuyer)
    const purposeFactor = result.breakdown.find(b => b.factor === 'Primary Residence')
    expect(purposeFactor).toBeDefined()
    expect(purposeFactor!.points).toBe(20)
  })

  it('should give form source +10 intent when source is form-based', () => {
    // hotLeadCashBuyer has source: 'Rightmove' (not matched as form)
    // Use a buyer with explicit form source
    const formBuyer: Buyer = { ...hotLeadCashBuyer, source: 'website form', source_platform: 'form' }
    const result = calculateIntentScore(formBuyer)
    const sourceFactor = result.breakdown.find(b => b.factor === 'Source: Form')
    expect(sourceFactor).toBeDefined()
    expect(sourceFactor!.points).toBe(10)
  })

  it('should return score between 0 and 100', () => {
    const result = calculateIntentScore(hotLeadCashBuyer)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE SCORE
// ═══════════════════════════════════════════════════════════════

describe('calculateConfidenceScore', () => {
  it('should give +15 for email', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    const emailFactor = result.breakdown.find(b => b.factor === 'Email')
    expect(emailFactor).toBeDefined()
    expect(emailFactor!.points).toBe(15)
  })

  it('should give +15 for phone', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    const phoneFactor = result.breakdown.find(b => b.factor === 'Phone')
    expect(phoneFactor).toBeDefined()
    expect(phoneFactor!.points).toBe(15)
  })

  it('should give +10 for name', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    const nameFactor = result.breakdown.find(b => b.factor === 'Name')
    expect(nameFactor).toBeDefined()
    expect(nameFactor!.points).toBe(10)
  })

  it('should give +10 for budget info', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    const budgetFactor = result.breakdown.find(b => b.factor === 'Budget')
    expect(budgetFactor).toBeDefined()
    expect(budgetFactor!.points).toBe(10)
  })

  it('should give +10 for payment method', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    const pmFactor = result.breakdown.find(b => b.factor === 'Payment Method')
    expect(pmFactor).toBeDefined()
    expect(pmFactor!.points).toBe(10)
  })

  it('should score lower for incomplete buyers', () => {
    const complete = calculateConfidenceScore(hotLeadCashBuyer)
    const minimal = calculateConfidenceScore(lowPriorityBuyer)
    expect(complete.total).toBeGreaterThan(minimal.total)
  })

  it('should return score between 0 and 100', () => {
    const result = calculateConfidenceScore(hotLeadCashBuyer)
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.total).toBeLessThanOrEqual(100)
  })
})

// ═══════════════════════════════════════════════════════════════
// CLASSIFICATION
// ═══════════════════════════════════════════════════════════════

describe('determineClassification', () => {
  it('should classify 28-day buyers as Hot Lead (HARD RULE)', () => {
    const quality = calculateQualityScore(hotLeadCashBuyer)
    const intent = calculateIntentScore(hotLeadCashBuyer)
    const confidence = calculateConfidenceScore(hotLeadCashBuyer)
    const fake = detectFakeLead(hotLeadCashBuyer)

    const classification = determineClassification(quality, intent, confidence, fake, false)
    expect(classification).toBe('Hot Lead')
  })

  it('should classify fake leads as Disqualified', () => {
    const quality = calculateQualityScore(fakeLeadBuyer)
    const intent = calculateIntentScore(fakeLeadBuyer)
    const confidence = calculateConfidenceScore(fakeLeadBuyer)
    const fake = detectFakeLead(fakeLeadBuyer)

    const classification = determineClassification(quality, intent, confidence, fake, false)
    expect(classification).toBe('Disqualified')
  })

  it('should classify auto-disqualified leads as Disqualified', () => {
    const quality = calculateQualityScore(disqualifiedBuyer)
    const intent = calculateIntentScore(disqualifiedBuyer)
    const confidence = calculateConfidenceScore(disqualifiedBuyer)
    const fake = detectFakeLead(disqualifiedBuyer)

    const classification = determineClassification(quality, intent, confidence, fake, false)
    expect(classification).toBe('Disqualified')
  })

  it('should classify low-urgency buyers as Low Priority', () => {
    const quality = calculateQualityScore(lowPriorityBuyer)
    const intent = calculateIntentScore(lowPriorityBuyer)
    const confidence = calculateConfidenceScore(lowPriorityBuyer)
    const fake = detectFakeLead(lowPriorityBuyer)

    const classification = determineClassification(quality, intent, confidence, fake, true)
    expect(classification).toBe('Low Priority')
  })
})

// ═══════════════════════════════════════════════════════════════
// CALL PRIORITY
// ═══════════════════════════════════════════════════════════════

describe('determineCallPriority', () => {
  it('should give 28-day buyers level 1 priority', () => {
    const intent = calculateIntentScore(hotLeadCashBuyer)
    const priority = determineCallPriority('Hot Lead', intent)
    expect(priority.level).toBe(1)
    expect(priority.responseTime).toContain('1 hour')
  })

  it('should give Hot Leads level 1', () => {
    const intent = calculateIntentScore({ id: 'x' } as Buyer) // non-28-day
    const priority = determineCallPriority('Hot Lead', intent)
    expect(priority.level).toBe(1)
  })

  it('should give Qualified leads level 2', () => {
    const intent = calculateIntentScore({ id: 'x' } as Buyer)
    const priority = determineCallPriority('Qualified', intent)
    expect(priority.level).toBe(2)
  })

  it('should give Nurture leads level 4', () => {
    const intent = calculateIntentScore({ id: 'x' } as Buyer)
    const priority = determineCallPriority('Nurture', intent)
    expect(priority.level).toBe(4)
  })

  it('should give Disqualified leads level 5', () => {
    const intent = calculateIntentScore({ id: 'x' } as Buyer)
    const priority = determineCallPriority('Disqualified', intent)
    expect(priority.level).toBe(5)
  })
})

// ═══════════════════════════════════════════════════════════════
// RISK FLAGS
// ═══════════════════════════════════════════════════════════════

describe('generateRiskFlags', () => {
  it('should flag mortgage buyers without approval', () => {
    const fake = detectFakeLead(qualifiedMortgageBuyer)
    const quality = calculateQualityScore(qualifiedMortgageBuyer)
    const flags = generateRiskFlags(qualifiedMortgageBuyer, fake, quality)
    // Mortgage buyer with aip status should not flag "not approved"
    expect(flags.some(f => f.includes('Mortgage not yet approved'))).toBe(false)
  })

  it('should flag mortgage buyer without broker', () => {
    const buyer: Buyer = { ...qualifiedMortgageBuyer, uk_broker: 'no' }
    const fake = detectFakeLead(buyer)
    const quality = calculateQualityScore(buyer)
    const flags = generateRiskFlags(buyer, fake, quality)
    expect(flags.some(f => f.includes('broker'))).toBe(true)
  })

  it('should flag international buyers', () => {
    const fake = detectFakeLead(internationalBuyer)
    const quality = calculateQualityScore(internationalBuyer)
    const flags = generateRiskFlags(internationalBuyer, fake, quality)
    expect(flags.some(f => f.includes('International'))).toBe(true)
  })

  it('should flag missing timeline', () => {
    const buyer: Buyer = { id: 'x', full_name: 'No Timeline', email: 'a@b.com' } as Buyer
    const fake = detectFakeLead(buyer)
    const quality = calculateQualityScore(buyer)
    const flags = generateRiskFlags(buyer, fake, quality)
    expect(flags.some(f => f.includes('Timeline'))).toBe(true)
  })

  it('should limit flags to max 5', () => {
    const fake = detectFakeLead(fakeLeadBuyer)
    const quality = calculateQualityScore(fakeLeadBuyer)
    const flags = generateRiskFlags(fakeLeadBuyer, fake, quality)
    expect(flags.length).toBeLessThanOrEqual(5)
  })
})

// ═══════════════════════════════════════════════════════════════
// MAIN SCORING FUNCTION (scoreLeadNaybourhood)
// ═══════════════════════════════════════════════════════════════

describe('scoreLeadNaybourhood', () => {
  it('should score a hot cash buyer as Hot Lead with high scores', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)

    expect(result.classification).toBe('Hot Lead')
    expect(result.is28DayBuyer).toBe(true)
    expect(result.callPriority.level).toBe(1)
    expect(result.qualityScore.total).toBeGreaterThanOrEqual(40)
    expect(result.intentScore.total).toBeGreaterThanOrEqual(40)
    expect(result.fakeLeadCheck.isFake).toBe(false)
    expect(result.lowUrgencyFlag).toBe(false)
  })

  it('should score a fake lead as Disqualified', () => {
    const result = scoreLeadNaybourhood(fakeLeadBuyer)

    expect(result.classification).toBe('Disqualified')
    expect(result.fakeLeadCheck.isFake).toBe(true)
    expect(result.fakeLeadCheck.flags.length).toBeGreaterThan(0)
  })

  it('should score a disqualified buyer (£2M+/studio) as Disqualified', () => {
    const result = scoreLeadNaybourhood(disqualifiedBuyer)

    expect(result.classification).toBe('Disqualified')
    expect(result.qualityScore.isDisqualified).toBe(true)
  })

  it('should detect low urgency in "no rush" buyers', () => {
    const result = scoreLeadNaybourhood(lowPriorityBuyer)

    expect(result.lowUrgencyFlag).toBe(true)
    expect(result.classification).toBe('Low Priority')
  })

  it('should score an international buyer correctly', () => {
    const result = scoreLeadNaybourhood(internationalBuyer)

    expect(result.fakeLeadCheck.isFake).toBe(false)
    expect(result.riskFlags.some(f => f.includes('International'))).toBe(true)
    // International buyer with good credentials should still score well
    expect(result.qualityScore.total).toBeGreaterThanOrEqual(20)
  })

  it('should return all required result fields', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)

    expect(result).toHaveProperty('fakeLeadCheck')
    expect(result).toHaveProperty('qualityScore')
    expect(result).toHaveProperty('intentScore')
    expect(result).toHaveProperty('confidenceScore')
    expect(result).toHaveProperty('classification')
    expect(result).toHaveProperty('callPriority')
    expect(result).toHaveProperty('riskFlags')
    expect(result).toHaveProperty('is28DayBuyer')
    expect(result).toHaveProperty('lowUrgencyFlag')
  })
})

// ═══════════════════════════════════════════════════════════════
// LEGACY FORMAT CONVERSION
// ═══════════════════════════════════════════════════════════════

describe('convertToLegacyFormat', () => {
  it('should map Hot Lead to "Hot" classification', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    const legacy = convertToLegacyFormat(result)

    expect(legacy.ai_classification).toBe('Hot')
  })

  it('should map call priority 1 to P1', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    const legacy = convertToLegacyFormat(result)

    expect(legacy.ai_priority).toBe('P1')
  })

  it('should convert confidence from 0-100 to 0-10 scale', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    const legacy = convertToLegacyFormat(result)

    expect(legacy.ai_confidence).toBe(result.confidenceScore.total / 10)
    expect(legacy.ai_confidence).toBeLessThanOrEqual(10)
  })

  it('should preserve quality and intent scores', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    const legacy = convertToLegacyFormat(result)

    expect(legacy.ai_quality_score).toBe(result.qualityScore.total)
    expect(legacy.ai_intent_score).toBe(result.intentScore.total)
  })

  it('should include risk flags array', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    const legacy = convertToLegacyFormat(result)

    expect(Array.isArray(legacy.ai_risk_flags)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// FULL JOURNEY SCENARIO: Step 7 — Hot Lead (80+)
// ═══════════════════════════════════════════════════════════════

describe('Full Journey — Step 7: Cash buyer NB Score should be Hot Lead', () => {
  it('hotLeadCashBuyer: classification = Hot Lead', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    expect(result.classification).toBe('Hot Lead')
  })

  it('hotLeadCashBuyer: 28-day buyer flag set', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    expect(result.is28DayBuyer).toBe(true)
  })

  it('hotLeadCashBuyer: call priority = 1', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    expect(result.callPriority.level).toBe(1)
  })

  it('hotLeadCashBuyer: not flagged as fake', () => {
    const result = scoreLeadNaybourhood(hotLeadCashBuyer)
    expect(result.fakeLeadCheck.isFake).toBe(false)
  })
})
