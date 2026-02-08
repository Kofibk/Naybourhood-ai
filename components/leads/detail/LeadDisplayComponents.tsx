'use client'

import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { CLASSIFICATION_CONFIG, PRIORITY_CONFIG } from '@/lib/leadUtils'

// Boolean Indicator Component
export function BooleanIndicator({ value, showText = true }: { value: boolean | undefined | null; showText?: boolean }) {
  return value ? (
    <span className="text-green-600 flex items-center gap-1">
      <CheckCircle className="h-4 w-4" /> {showText && 'Yes'}
    </span>
  ) : (
    <span className="text-red-400 flex items-center gap-1">
      <XCircle className="h-4 w-4" /> {showText && 'No'}
    </span>
  )
}

// Classification Badge with Explanation
export function ClassificationBadge({ classification, showExplanation = false }: { classification: string; showExplanation?: boolean }) {
  const config = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']

  return (
    <div>
      <span className={`rounded-lg font-medium px-4 py-2 text-lg ${config.bg} ${config.text}`}>
        {config.label}
      </span>
      {showExplanation && (
        <p className="text-xs text-muted-foreground mt-2 max-w-xs">{config.description}</p>
      )}
    </div>
  )
}

// Priority Badge with Explanation
export function PriorityBadge({ priority, showExplanation = false }: { priority: string; showExplanation?: boolean }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['P4']

  return (
    <div>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bg}`}>
        <Clock className="w-4 h-4" />
        <span className="font-medium">{config.label}</span>
        <span className="text-xs opacity-75">({config.time})</span>
      </div>
      {showExplanation && (
        <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
      )}
    </div>
  )
}

// Payment Badge
export function PaymentBadge({ method }: { method: string | undefined | null }) {
  if (!method) return <span className="text-muted-foreground">-</span>
  const isCash = method.toLowerCase() === 'cash'
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${isCash ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
      {method} {isCash && '✓'}
    </span>
  )
}

// Data Row Component for consistent styling
export function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-2 flex-shrink-0">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-right break-words">{value || '-'}</span>
    </div>
  )
}

// Score Card with Progress Bar
export function ScoreCard({ label, score, maxScore = 100, explanation }: { label: string; score: number | null | undefined; maxScore?: number; explanation?: string }) {
  // Handle null/undefined scores - show as unscored
  if (score === null || score === undefined) {
    return (
      <div className="border rounded-lg p-4 min-w-[140px] bg-card">
        <div className="text-sm text-muted-foreground mb-1">{label}</div>
        <div className="text-3xl font-bold text-muted-foreground">-</div>
        <div className="w-full h-2 bg-muted rounded-full mt-2" />
        {explanation && (
          <p className="text-xs text-muted-foreground mt-2">Scoring...</p>
        )}
      </div>
    )
  }

  const percentage = (score / maxScore) * 100
  const getColor = (p: number) => {
    if (p >= 70) return 'bg-green-500'
    if (p >= 45) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  return (
    <div className="border rounded-lg p-4 min-w-[140px] bg-card">
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className="text-3xl font-bold">{score}{maxScore !== 100 && <span className="text-lg text-muted-foreground">/{maxScore}</span>}</div>
      <div className="w-full h-2 bg-muted rounded-full mt-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {explanation && (
        <p className="text-xs text-muted-foreground mt-2">{explanation}</p>
      )}
    </div>
  )
}

// Score Breakdown Section
export function ScoreBreakdownSection({
  title,
  items,
  isOpen,
  onToggle
}: {
  title: string
  items: Array<{ label: string; score: number; maxScore: number; details?: string[] }>
  isOpen: boolean
  onToggle: () => void
}) {
  const total = items.reduce((sum, item) => sum + item.score, 0)
  const maxTotal = items.reduce((sum, item) => sum + item.maxScore, 0)
  const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium">{title}</span>
          <span className="text-sm text-muted-foreground">{total}/{maxTotal} pts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-muted rounded-full">
            <div
              className={`h-2 rounded-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 45 ? 'bg-orange-500' : 'bg-gray-400'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {isOpen && (
        <div className="p-3 space-y-3 bg-card">
          {items.map((item, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.score}/{item.maxScore}</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${item.maxScore > 0 ? (item.score / item.maxScore) * 100 : 0}%` }}
                />
              </div>
              {item.details && item.details.length > 0 && (
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 pl-2">
                  {item.details.map((d, j) => (
                    <li key={j} className="flex items-start gap-1">
                      <span className="text-primary">•</span> {d}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
