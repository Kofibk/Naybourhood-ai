'use client'

import { User } from 'lucide-react'

interface BuyerOverviewSignal {
  label: string
  detail: string
}

interface StructuredSummary {
  paragraph: string
  signals: BuyerOverviewSignal[]
}

/**
 * Parses a summary string into structured format.
 * Handles both new JSON format and legacy plain text.
 */
function parseSummary(raw: string): StructuredSummary | null {
  if (!raw) return null

  // Try parsing as JSON (new structured format)
  try {
    const parsed = JSON.parse(raw)
    if (parsed.paragraph && Array.isArray(parsed.signals)) {
      return parsed as StructuredSummary
    }
  } catch {
    // Not JSON — treat as legacy plain text
  }

  // Legacy plain text: return as paragraph with no signals
  return { paragraph: raw, signals: [] }
}

/**
 * Parse enrichment text (from background_research field) into signals.
 * The enrichment text has a structured format like:
 *   - Identity Confirmed: yes
 *   - Professional Background: Chairman of SOCOGIE SARL...
 *   - Business Activity: ...
 *   - Risk Flags: ...
 */
function parseEnrichmentSignals(enrichmentText: string): BuyerOverviewSignal[] {
  if (!enrichmentText || enrichmentText.length < 20) return []

  const signals: BuyerOverviewSignal[] = []

  const fieldMap: Array<{ regex: RegExp; label: string }> = [
    { regex: /Professional Background:\s*(.+?)(?:\n-|\n\n|$)/i, label: 'Professional Background' },
    { regex: /Business Activity:\s*(.+?)(?:\n-|\n\n|$)/i, label: 'Business Activity' },
    { regex: /Wealth Signals:\s*(.+?)(?:\n-|\n\n|$)/i, label: 'Financial Profile' },
    { regex: /Property History:\s*(.+?)(?:\n-|\n\n|$)/i, label: 'Property Intent' },
    { regex: /Media Presence:\s*(.+?)(?:\n-|\n\n|$)/i, label: 'Media Presence' },
    { regex: /Risk Flags:\s*(.+?)(?:\n-|\n\n|$)/i, label: 'Risk Flag' },
  ]

  for (const { regex, label } of fieldMap) {
    const match = enrichmentText.match(regex)
    if (match?.[1]) {
      const detail = match[1].trim()
      // Skip empty/no-data fields
      if (detail && !detail.toLowerCase().startsWith('no data') && !detail.toLowerCase().startsWith('none') && detail.length > 5) {
        signals.push({ label, detail: detail.endsWith('.') ? detail : detail + '.' })
      }
    }
  }

  return signals
}

/**
 * Generate signals client-side from buyer data when no structured
 * ai_summary is available (legacy plain-text summaries).
 */
function generateClientSignals(buyer: BuyerData): BuyerOverviewSignal[] {
  const signals: BuyerOverviewSignal[] = []

  // Financial Profile
  const payment = (buyer.paymentMethod || '').toLowerCase()
  if (payment === 'cash') {
    if (buyer.proofOfFunds) {
      signals.push({ label: 'Financial Profile', detail: `Verified cash buyer${buyer.budget ? ` with ${buyer.budget} budget` : ''}.` })
    } else {
      signals.push({ label: 'Financial Profile', detail: `Claims cash buyer status${buyer.budget ? ` with ${buyer.budget} budget` : ''} but proof of funds not yet provided.` })
    }
  } else if (payment === 'mortgage') {
    const ms = (buyer.mortgageStatus || '').toLowerCase()
    if (ms === 'approved' || ms === 'aip') {
      signals.push({ label: 'Financial Profile', detail: `Mortgage buyer with AIP in place${buyer.budget ? `, targeting ${buyer.budget}` : ''}.` })
    } else {
      signals.push({ label: 'Financial Profile', detail: `Mortgage buyer without AIP${buyer.budget ? `, targeting ${buyer.budget}` : ''} — financing unconfirmed.` })
    }
  }

  // Property Intent
  const bedrooms = buyer.bedrooms
  const location = buyer.location
  if (bedrooms || location) {
    const parts = [bedrooms ? `${bedrooms}-bed` : '', location].filter(Boolean).join(' in ')
    const is28 = buyer.readyIn28Days
    signals.push({ label: 'Property Intent', detail: `Looking for ${parts}${is28 ? ' with 28-day purchase readiness' : ''}.` })
  }

  // Verification Status
  signals.push({ label: 'Verification Status', detail: 'Not yet verified — AML/KYC check recommended before progressing.' })

  // International Exposure
  const country = (buyer.country || '').toLowerCase()
  if (country && !['uk', 'united kingdom', 'england', 'scotland', 'wales', 'gb', 'great britain'].includes(country)) {
    signals.push({ label: 'International Exposure', detail: `Based in ${buyer.country}; international payment and legal considerations apply.` })
  }

  // Professional Background
  const job = buyer.jobTitle
  const company = buyer.companyName
  const prof = job && company ? `${job} at ${company}` : job || company || ''
  if (prof) {
    signals.push({ label: 'Professional Background', detail: `${prof}.` })
  }

  // Engagement
  if (buyer.source) {
    signals.push({ label: 'Engagement', detail: `Sourced via ${buyer.source}.` })
  }

  // Missing Data (only commercially meaningful)
  const missing: string[] = []
  if (!buyer.budget) missing.push('budget')
  if (!buyer.timeline) missing.push('timeline')
  if (!buyer.phone && !buyer.email) missing.push('contact details')
  if (missing.length > 0) {
    signals.push({ label: 'Missing Data', detail: `No ${missing.join(', ')} provided — limits qualification accuracy.` })
  }

  return signals.slice(0, 6)
}

/**
 * Build a paragraph from buyer data when the stored summary is legacy text.
 */
function generateClientParagraph(buyer: BuyerData): string {
  const name = buyer.fullName || 'This buyer'
  const payment = (buyer.paymentMethod || 'potential').toLowerCase()
  const paymentDesc = payment === 'cash' ? 'cash' : payment === 'mortgage' ? 'mortgage' : buyer.paymentMethod || 'potential'
  const bedrooms = buyer.bedrooms ? `${buyer.bedrooms}-bedroom property` : 'property'
  const loc = buyer.location || 'an unspecified location'

  const job = buyer.jobTitle
  const company = buyer.companyName
  const prof = job && company ? `${job} at ${company}` : job || company || ''

  let para = ''
  if (prof) {
    para = `${name} is a ${prof} seeking a ${bedrooms} in ${loc} via ${paymentDesc}.`
  } else {
    para = `${name} is a ${paymentDesc} buyer seeking a ${bedrooms} in ${loc}.`
  }

  const budgetPart = buyer.budget ? `Budget: ${buyer.budget}` : 'Budget not disclosed'
  if (buyer.readyIn28Days) {
    para += ` ${budgetPart}; ready to complete within 28 days, making this an immediate-priority lead.`
  } else if (buyer.timeline) {
    para += ` ${budgetPart}; timeline: ${buyer.timeline}.`
  } else {
    para += ` ${budgetPart}; purchase timeline not yet confirmed.`
  }

  return para
}

const SIGNAL_COLORS: Record<string, string> = {
  'Financial Profile': 'text-emerald-400',
  'Property Intent': 'text-blue-400',
  'Verification Status': 'text-amber-400',
  'Engagement': 'text-cyan-400',
  'International Exposure': 'text-purple-400',
  'Professional Background': 'text-indigo-400',
  'Risk Flag': 'text-red-400',
  'Next Action Readiness': 'text-emerald-400',
  'Missing Data': 'text-orange-400',
  'Media Presence': 'text-pink-400',
  'Business Activity': 'text-teal-400',
}

export interface BuyerData {
  fullName?: string | null
  email?: string | null
  phone?: string | null
  paymentMethod?: string | null
  budget?: string | null
  location?: string | null
  bedrooms?: string | number | null
  timeline?: string | null
  country?: string | null
  source?: string | null
  proofOfFunds?: boolean | null
  mortgageStatus?: string | null
  readyIn28Days?: boolean | null
  jobTitle?: string | null
  companyName?: string | null
}

interface BuyerOverviewCardProps {
  backgroundResearch?: string | null
  buyerSummary?: string | null
  aiSummary?: string | null
  /** Pass buyer data to generate signals client-side for legacy summaries */
  buyer?: BuyerData | null
}

export function BuyerOverviewCard({ backgroundResearch, buyerSummary, aiSummary, buyer }: BuyerOverviewCardProps) {
  const summaryText = aiSummary || ''
  const enrichmentText = backgroundResearch || buyerSummary || ''

  // Try to parse the AI summary as structured JSON
  const structured = parseSummary(summaryText)

  // Parse enrichment data for signals (from background_research)
  const enrichmentSignals = parseEnrichmentSignals(enrichmentText)
  const hasEnrichment = enrichmentSignals.length > 0

  // If no data at all, don't render
  if (!structured && !enrichmentText && !buyer) return null

  // Check if we have the new structured format (JSON with paragraph + signals)
  const hasStructuredSignals = structured && structured.signals.length > 0

  let paragraph: string
  let signals: BuyerOverviewSignal[]

  if (hasStructuredSignals) {
    // BEST: Structured AI summary with signals (from Claude after enrichment)
    paragraph = structured.paragraph
    signals = structured.signals
  } else if (hasEnrichment) {
    // ENRICHED: We have web enrichment data — use AI paragraph (or generate one)
    // and pair with enrichment-derived signals
    paragraph = (structured && structured.paragraph && structured.paragraph.length > 30)
      ? structured.paragraph
      : (buyer ? generateClientParagraph(buyer) : structured?.paragraph || '')
    // Merge enrichment signals with client-side signals, enrichment takes priority
    const enrichmentLabels = new Set(enrichmentSignals.map(s => s.label))
    const clientSignals = buyer
      ? generateClientSignals(buyer).filter(s => !enrichmentLabels.has(s.label))
      : []
    signals = [...enrichmentSignals, ...clientSignals].slice(0, 6)
  } else if (structured && structured.paragraph && structured.paragraph.length > 50) {
    // GOOD: AI-generated plain text summary (from Claude, richer than client-side)
    paragraph = structured.paragraph
    signals = buyer ? generateClientSignals(buyer) : []
  } else if (buyer) {
    // FALLBACK: No AI summary — generate entirely from buyer data client-side
    paragraph = generateClientParagraph(buyer)
    signals = generateClientSignals(buyer)
  } else {
    // BARE: Just show whatever text we have
    paragraph = enrichmentText || structured?.paragraph || ''
    signals = []
  }

  if (!paragraph) return null

  return (
    <div className="bg-[#111111] border border-blue-500/30 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">Buyer Overview</h4>

          {/* Part 1: Paragraph */}
          <p className="text-sm text-white/70 leading-relaxed">
            {paragraph}
          </p>

          {/* Part 2: Key Signals */}
          {signals.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {signals.map((signal, i) => (
                <li key={i} className="text-sm flex items-start gap-1.5">
                  <span className="text-white/30 mt-0.5 flex-shrink-0">•</span>
                  <span>
                    <span className={`font-medium ${SIGNAL_COLORS[signal.label] || 'text-white/80'}`}>
                      {signal.label}
                    </span>
                    <span className="text-white/50"> — {signal.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
