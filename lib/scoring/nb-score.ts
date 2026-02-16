/**
 * NB Score — Naybourhood's hero metric.
 *
 * Weighted combination of quality, intent, and confidence scores.
 * This is the single number users should focus on.
 */

/**
 * Calculate the NB Score.
 * @param quality  0-100 (Quality Score)
 * @param intent   0-100 (Intent Score)
 * @param confidence 0-10 (Confidence Score, normalized internally)
 * @returns 0-100 NB Score
 */
export function calculateNBScore(
  quality: number = 0,
  intent: number = 0,
  confidence: number = 0
): number {
  const normalizedConfidence = (confidence / 10) * 100
  return Math.round(quality * 0.5 + intent * 0.3 + normalizedConfidence * 0.2)
}

/**
 * Get the colour for an NB Score value.
 */
export function getNBScoreColor(score: number): string {
  if (score >= 70) return '#34D399' // green
  if (score >= 40) return '#FBBF24' // amber
  return '#EF4444'                   // red
}
