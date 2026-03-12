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

interface BuyerOverviewCardProps {
  backgroundResearch?: string | null
  buyerSummary?: string | null
  aiSummary?: string | null
}

export function BuyerOverviewCard({ backgroundResearch, buyerSummary, aiSummary }: BuyerOverviewCardProps) {
  // Combine sources: background_research/buyer_summary as context, ai_summary as main
  const primaryText = backgroundResearch || buyerSummary || ''
  const summaryText = aiSummary || ''

  // Try to parse the AI summary as structured
  const structured = parseSummary(summaryText)
  const legacyContext = parseSummary(primaryText)

  // If neither source has data, don't render
  if (!structured && !legacyContext) return null

  // Use the best available structured data
  // If AI summary is structured, use it. Otherwise combine texts.
  const hasStructuredSignals = structured && structured.signals.length > 0

  // Build the paragraph: prefer structured AI summary, fall back to combined text
  const paragraph = hasStructuredSignals
    ? structured.paragraph
    : [legacyContext?.paragraph, structured?.paragraph].filter(Boolean).join(' ')

  const signals = hasStructuredSignals ? structured.signals : (legacyContext?.signals || [])

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
