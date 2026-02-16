/**
 * NB Score (hero metric) — Unit Tests
 *
 * Tests the weighted NB Score calculation:
 *   NB Score = Quality × 0.5 + Intent × 0.3 + (Confidence/10×100) × 0.2
 *
 * Maps to Full Journey Test steps:
 *   7. See instant NB Score — should be Hot Lead (80+)
 *   9. Dashboard loads with NB Score shown
 *  16. Detail page shows NB Score ring
 */
import { describe, it, expect } from 'vitest'
import { calculateNBScore, getNBScoreColor } from '@/lib/scoring/nb-score'

describe('calculateNBScore', () => {
  it('should return 0 when all inputs are 0', () => {
    expect(calculateNBScore(0, 0, 0)).toBe(0)
  })

  it('should return 100 when all inputs are maxed', () => {
    // quality=100, intent=100, confidence=10
    // 100×0.5 + 100×0.3 + (10/10×100)×0.2 = 50 + 30 + 20 = 100
    expect(calculateNBScore(100, 100, 10)).toBe(100)
  })

  it('should weight quality at 50%', () => {
    // quality=80, intent=0, confidence=0
    // 80×0.5 = 40
    expect(calculateNBScore(80, 0, 0)).toBe(40)
  })

  it('should weight intent at 30%', () => {
    // quality=0, intent=80, confidence=0
    // 80×0.3 = 24
    expect(calculateNBScore(0, 80, 0)).toBe(24)
  })

  it('should weight confidence at 20% (normalized from 0-10)', () => {
    // quality=0, intent=0, confidence=10
    // (10/10×100)×0.2 = 20
    expect(calculateNBScore(0, 0, 10)).toBe(20)
  })

  it('should compute Hot Lead scenario correctly', () => {
    // Typical hot lead: quality=55, intent=70, confidence=9 (0-10)
    // 55×0.5 + 70×0.3 + (9/10×100)×0.2 = 27.5 + 21 + 18 = 66.5 → 67
    const score = calculateNBScore(55, 70, 9)
    expect(score).toBe(67)
  })

  it('should handle default parameters', () => {
    expect(calculateNBScore()).toBe(0)
    expect(calculateNBScore(50)).toBe(25) // 50×0.5
    expect(calculateNBScore(50, 50)).toBe(40) // 50×0.5 + 50×0.3
  })

  it('should return an integer (rounded)', () => {
    const score = calculateNBScore(33, 67, 5)
    expect(Number.isInteger(score)).toBe(true)
  })
})

describe('getNBScoreColor', () => {
  it('should return green (#34D399) for scores >= 70', () => {
    expect(getNBScoreColor(70)).toBe('#34D399')
    expect(getNBScoreColor(85)).toBe('#34D399')
    expect(getNBScoreColor(100)).toBe('#34D399')
  })

  it('should return amber (#FBBF24) for scores 40-69', () => {
    expect(getNBScoreColor(40)).toBe('#FBBF24')
    expect(getNBScoreColor(55)).toBe('#FBBF24')
    expect(getNBScoreColor(69)).toBe('#FBBF24')
  })

  it('should return red (#EF4444) for scores < 40', () => {
    expect(getNBScoreColor(0)).toBe('#EF4444')
    expect(getNBScoreColor(20)).toBe('#EF4444')
    expect(getNBScoreColor(39)).toBe('#EF4444')
  })
})
