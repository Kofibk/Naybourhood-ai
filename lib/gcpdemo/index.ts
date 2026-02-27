/**
 * GCP Demo — Aroundtown Kensington
 * Central data export for the demo at naybourhood.ai/gcpdemo
 */

export * from './types'
export { DEMO_PROPERTY, DEMO_AVAILABLE_UNITS, DEMO_OCCUPIED_UNITS } from './property'
export { KEY_ENQUIRERS } from './enquirers-key'
export { GENERATED_ENQUIRERS } from './enquirers-generated'
export { DEMO_CONVERSATIONS } from './conversations'

import { KEY_ENQUIRERS } from './enquirers-key'
import { GENERATED_ENQUIRERS } from './enquirers-generated'
import { DEMO_AVAILABLE_UNITS } from './property'
import { DEMO_CONVERSATIONS } from './conversations'
import type { DemoEnquirer, PipelineStatus } from './types'

/** All 60 enquirers combined */
export const ALL_ENQUIRERS: DemoEnquirer[] = [...KEY_ENQUIRERS, ...GENERATED_ENQUIRERS]

/** Lookup an enquirer by ID */
export function getEnquirerById(id: string): DemoEnquirer | undefined {
  return ALL_ENQUIRERS.find(e => e.id === id)
}

/** Lookup enquirers linked to a unit */
export function getEnquirersForUnit(unitName: string): DemoEnquirer[] {
  const unit = DEMO_AVAILABLE_UNITS.find(u => u.name === unitName)
  if (!unit) return []
  return unit.matchedLeadIds
    .map(id => ALL_ENQUIRERS.find(e => e.id === id))
    .filter((e): e is DemoEnquirer => e !== undefined)
}

/** Get conversation for an enquirer */
export function getConversationForEnquirer(enquirerId: string): typeof DEMO_CONVERSATIONS[0] | undefined {
  return DEMO_CONVERSATIONS.find(c => c.enquirerId === enquirerId)
}

/** Pipeline status counts */
export function getPipelineCounts(): Record<PipelineStatus, number> {
  const counts: Record<PipelineStatus, number> = {
    'Scored': 0,
    'Viewing Booked': 0,
    'Viewing Complete': 0,
    'Verification In Progress': 0,
    'Verified': 0,
    'Tenancy Signed': 0,
    'Flagged': 0,
    'Fell Through': 0,
    'Archived': 0,
  }
  for (const e of ALL_ENQUIRERS) {
    counts[e.pipelineStatus]++
  }
  return counts
}

/** Dashboard stats */
export function getDashboardStats() {
  const pipeline = getPipelineCounts()
  const scores = ALL_ENQUIRERS.map(e => e.aiScore)
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  const activeEnquirers = ALL_ENQUIRERS.filter(
    e => e.pipelineStatus !== 'Archived' && e.pipelineStatus !== 'Fell Through'
  )

  return {
    totalUnits: 70,
    occupiedUnits: 60,
    availableUnits: 10,
    occupancyRate: 85.7,
    totalEnquirers: ALL_ENQUIRERS.length,
    activeEnquirers: activeEnquirers.length,
    avgScore,
    pipeline,
    conversationsCompleted: DEMO_CONVERSATIONS.filter(c => c.status === 'Completed').length,
    conversationsFlagged: DEMO_CONVERSATIONS.filter(c => c.status === 'Flagged').length,
    totalConversations: DEMO_CONVERSATIONS.length,
    highRisk: ALL_ENQUIRERS.filter(e => e.riskLevel === 'High').length,
    lowRisk: ALL_ENQUIRERS.filter(e => e.riskLevel === 'Low').length,
    mediumRisk: ALL_ENQUIRERS.filter(e => e.riskLevel === 'Medium').length,
    avgDaysInPipeline: Math.round(
      ALL_ENQUIRERS.reduce((a, e) => a + e.daysInPipeline, 0) / ALL_ENQUIRERS.length
    ),
    lettingsVelocity: {
      scored: pipeline['Scored'],
      viewingBooked: pipeline['Viewing Booked'],
      viewingComplete: pipeline['Viewing Complete'],
      verifying: pipeline['Verification In Progress'],
      verified: pipeline['Verified'],
      signed: pipeline['Tenancy Signed'],
      flagged: pipeline['Flagged'],
      fellThrough: pipeline['Fell Through'],
      archived: pipeline['Archived'],
    },
  }
}

/** Demo company info */
export const AROUNDTOWN_COMPANY = {
  id: 'aroundtown-demo-001',
  name: 'Aroundtown S.A.',
  type: 'Enterprise',
  website: 'aroundtown.de',
}

/** Demo user */
export const AROUNDTOWN_USER = {
  id: 'aroundtown-user-001',
  email: 'demo@aroundtown.de',
  name: 'Aroundtown Demo',
  role: 'agent' as const,
  company: AROUNDTOWN_COMPANY.name,
  company_id: AROUNDTOWN_COMPANY.id,
  isDemo: true,
}
