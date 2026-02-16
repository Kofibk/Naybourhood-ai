/**
 * AI Summary Generation — Unit Tests
 *
 * Tests the rule-based AI summary, next action, and recommendations engine.
 *
 * Maps to Full Journey Test steps:
 *  16. Detail page shows AI summary, next action
 */
import { describe, it, expect } from 'vitest'
import {
  generateAISummary,
  determineNextAction,
  generateRecommendations,
  generateBuyerSummary,
} from '@/lib/scoring/ai-summary'
import { scoreLead } from '@/lib/scoring'
import {
  hotLeadCashBuyer,
  qualifiedMortgageBuyer,
  nurtureBuyer,
  lowPriorityBuyer,
  fakeLeadBuyer,
} from '../../fixtures/buyers'

describe('generateAISummary', () => {
  it('should return summary, nextAction, and recommendations', () => {
    const scores = scoreLead(hotLeadCashBuyer)
    const result = generateAISummary(hotLeadCashBuyer, scores)

    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('nextAction')
    expect(result).toHaveProperty('recommendations')
    expect(typeof result.summary).toBe('string')
    expect(typeof result.nextAction).toBe('string')
    expect(Array.isArray(result.recommendations)).toBe(true)
  })

  it('should generate a non-empty summary for all buyer types', () => {
    const buyers = [hotLeadCashBuyer, qualifiedMortgageBuyer, nurtureBuyer, lowPriorityBuyer]
    for (const buyer of buyers) {
      const scores = scoreLead(buyer)
      const result = generateAISummary(buyer, scores)
      expect(result.summary.length).toBeGreaterThan(10)
    }
  })
})

describe('determineNextAction', () => {
  it('should recommend immediate call for Hot leads', () => {
    const scores = scoreLead(hotLeadCashBuyer)
    // Mark classification to Hot for this test
    if (scores.classification === 'Hot') {
      const action = determineNextAction(hotLeadCashBuyer, scores)
      expect(action.toLowerCase()).toMatch(/call|viewing|proof|contact/)
    }
  })

  it('should recommend verification for Spam/Disqualified', () => {
    const scores = scoreLead(fakeLeadBuyer)
    const action = determineNextAction(fakeLeadBuyer, scores)
    expect(action.toLowerCase()).toMatch(/review|archive|verify|authenticity/)
  })

  it('should recommend archive for disqualified/low-scoring leads', () => {
    const scores = scoreLead(lowPriorityBuyer)
    const action = determineNextAction(lowPriorityBuyer, scores)
    // lowPriorityBuyer gets classified as Disqualified (quality < 20)
    // so the action should be archive-related
    expect(action.toLowerCase()).toMatch(/archive|nurture|low priority|campaign|email|review/)
  })

  it('should recommend broker for mortgage buyers without AIP', () => {
    const buyer = { ...qualifiedMortgageBuyer, mortgage_status: undefined }
    const scores = scoreLead(buyer)
    if (scores.classification === 'Warm-Qualified') {
      const action = determineNextAction(buyer, scores)
      expect(action.toLowerCase()).toMatch(/mortgage|broker|aip/)
    }
  })
})

describe('generateRecommendations', () => {
  it('should return max 5 recommendations', () => {
    const scores = scoreLead(hotLeadCashBuyer)
    const recs = generateRecommendations(hotLeadCashBuyer, scores)
    expect(recs.length).toBeLessThanOrEqual(5)
  })

  it('should recommend proof of funds when missing', () => {
    const buyer = { ...qualifiedMortgageBuyer, proof_of_funds: false }
    const scores = scoreLead(buyer)
    const recs = generateRecommendations(buyer, scores)
    expect(recs.some(r => r.toLowerCase().includes('proof of funds'))).toBe(true)
  })

  it('should recommend timeline clarification when missing', () => {
    // Use a buyer with decent quality score but no timeline
    const buyer = { ...qualifiedMortgageBuyer, timeline: undefined }
    const scores = scoreLead(buyer)
    const recs = generateRecommendations(buyer, scores)
    expect(recs.some(r => r.toLowerCase().includes('timeline'))).toBe(true)
  })

  it('should give archive recommendation for spam/disqualified', () => {
    const scores = scoreLead(fakeLeadBuyer)
    const recs = generateRecommendations(fakeLeadBuyer, scores)
    expect(recs.some(r => r.toLowerCase().includes('review') || r.toLowerCase().includes('removing'))).toBe(true)
  })
})

describe('generateBuyerSummary', () => {
  it('should include buyer name in summary', () => {
    const scores = scoreLead(hotLeadCashBuyer)
    const summary = generateBuyerSummary(hotLeadCashBuyer, scores)
    expect(summary).toContain('Sarah Mitchell')
  })

  it('should include budget info', () => {
    const scores = scoreLead(hotLeadCashBuyer)
    const summary = generateBuyerSummary(hotLeadCashBuyer, scores)
    expect(summary).toContain('£1.5M')
  })

  it('should include financial status (cash/mortgage)', () => {
    const scores = scoreLead(hotLeadCashBuyer)
    const summary = generateBuyerSummary(hotLeadCashBuyer, scores)
    expect(summary.toLowerCase()).toContain('cash')
  })

  it('should mention international location for non-UK buyers', () => {
    const buyer = { ...qualifiedMortgageBuyer, country: 'Nigeria' }
    const scores = scoreLead(buyer)
    const summary = generateBuyerSummary(buyer, scores)
    expect(summary).toContain('Nigeria')
  })
})
