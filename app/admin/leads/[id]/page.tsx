'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/contexts/DataContext'
import { EmailComposer } from '@/components/EmailComposer'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Edit,
  Archive,
  RefreshCw,
  Bot,
  Target,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  User,
  BarChart3,
  Building,
  ArrowRight,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  DollarSign,
  MapPin,
  FileText,
  Hash,
  Globe,
  Briefcase,
  Home,
  Save,
} from 'lucide-react'

// Status options
const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Fake',
  'Cant Verify',
  'Duplicate',
]

// Classification colors and labels
const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string; description: string }> = {
  'Hot': { bg: 'bg-red-500', text: 'text-white', label: 'Hot', description: 'Quality ≥70 AND Intent ≥70. Ready to buy. Respond within 1 hour.' },
  'Warm-Qualified': { bg: 'bg-orange-500', text: 'text-white', label: 'Warm (Qualified)', description: 'Quality ≥70, Intent ≥45. Financially ready but needs nurturing.' },
  'Warm-Engaged': { bg: 'bg-amber-500', text: 'text-white', label: 'Warm (Engaged)', description: 'Quality ≥45, Intent ≥70. Highly interested but needs qualification.' },
  'Nurture': { bg: 'bg-blue-400', text: 'text-white', label: 'Nurture', description: 'Quality 35-69, Intent 35-69. Requires longer-term engagement.' },
  'Cold': { bg: 'bg-gray-400', text: 'text-white', label: 'Cold', description: 'Lower scores. May need re-engagement or qualification.' },
  'Disqualified': { bg: 'bg-gray-600', text: 'text-white', label: 'Disqualified', description: 'Quality <20 OR Intent <20. Not suitable for current inventory.' },
  'Spam': { bg: 'bg-red-700', text: 'text-white', label: 'Spam', description: 'Detected as spam or fake lead.' },
}

const PRIORITY_CONFIG: Record<string, { bg: string; label: string; time: string; description: string }> = {
  'P1': { bg: 'bg-red-100 text-red-800 border-red-300', label: 'P1 - Urgent', time: '< 1 hour', description: 'Hot leads - respond immediately' },
  'P2': { bg: 'bg-orange-100 text-orange-800 border-orange-300', label: 'P2 - High', time: '< 4 hours', description: 'Warm leads - respond same day' },
  'P3': { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'P3 - Medium', time: '< 24 hours', description: 'Nurture leads - respond within a day' },
  'P4': { bg: 'bg-gray-100 text-gray-800 border-gray-300', label: 'P4 - Low', time: '48+ hours', description: 'Cold/Disqualified - low priority' },
}

// Boolean Indicator Component
function BooleanIndicator({ value, showText = true }: { value: boolean | undefined | null; showText?: boolean }) {
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

// Connection Status Options for Broker/Solicitor
const CONNECTION_STATUS_OPTIONS = [
  { value: 'yes', label: 'Yes, already has', icon: CheckCircle, color: 'text-green-600' },
  { value: 'introduced', label: 'Introduction made', icon: CheckCircle, color: 'text-green-600' },
  { value: 'no', label: "No, doesn't have", icon: XCircle, color: 'text-red-400' },
  { value: 'unknown', label: 'Unknown', icon: null, color: 'text-muted-foreground' },
] as const

// Connection Status Display Component
function ConnectionStatusDisplay({ value }: { value: string | boolean | undefined | null }) {
  // Handle legacy boolean values
  if (typeof value === 'boolean') {
    value = value ? 'yes' : 'unknown'
  }

  const status = CONNECTION_STATUS_OPTIONS.find(s => s.value === value) || CONNECTION_STATUS_OPTIONS[3]
  const Icon = status.icon

  return (
    <span className={`flex items-center gap-1 ${status.color}`}>
      {Icon ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4 inline-flex items-center justify-center">—</span>}
      <span className="text-xs">{status.label}</span>
    </span>
  )
}

// Editable Connection Status Component
function EditableConnectionStatus({
  value,
  onChange,
  label
}: {
  value: string | boolean | undefined | null
  onChange: (newValue: string) => void
  label: string
}) {
  // Handle legacy boolean values
  const currentValue = typeof value === 'boolean' ? (value ? 'yes' : 'unknown') : (value || 'unknown')

  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <select
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-background border border-input rounded-md px-2 py-1 max-w-[180px]"
      >
        {CONNECTION_STATUS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.value === 'yes' || option.value === 'introduced' ? '✓ ' : option.value === 'no' ? '✗ ' : '— '}
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Score Card with Progress Bar
function ScoreCard({ label, score, maxScore = 100, explanation }: { label: string; score: number | null | undefined; maxScore?: number; explanation?: string }) {
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

// Classification Badge with Explanation
function ClassificationBadge({ classification, showExplanation = false }: { classification: string; showExplanation?: boolean }) {
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
function PriorityBadge({ priority, showExplanation = false }: { priority: string; showExplanation?: boolean }) {
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
function PaymentBadge({ method }: { method: string | undefined | null }) {
  if (!method) return <span className="text-muted-foreground">-</span>
  const isCash = method.toLowerCase() === 'cash'
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${isCash ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
      {method} {isCash && '✓'}
    </span>
  )
}

// Data Row Component for consistent styling
function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-right max-w-[60%] truncate">{value || '-'}</span>
    </div>
  )
}

// Score Breakdown Section
function ScoreBreakdownSection({
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

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { leads, users, isLoading, updateLead, refreshData } = useData()

  const [isRescoring, setIsRescoring] = useState(false)
  const [scoreResult, setScoreResult] = useState<ScoreBuyerResponse | null>(null)
  const [openBreakdown, setOpenBreakdown] = useState<string | null>('quality')
  const [hasAutoScored, setHasAutoScored] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  const lead = useMemo(() => {
    return leads.find((l) => l.id === params.id)
  }, [leads, params.id])

  // Initialize notes value when lead loads
  useEffect(() => {
    if (lead?.notes) {
      setNotesValue(lead.notes)
    }
  }, [lead?.notes])

  const handleStatusChange = async (status: string) => {
    if (!lead) return
    await updateLead(lead.id, { status })
  }

  const handleAssigneeChange = async (assignee: string) => {
    if (!lead) return
    await updateLead(lead.id, { assigned_to: assignee })
  }

  const handleSaveNotes = async () => {
    if (!lead) return
    await updateLead(lead.id, { notes: notesValue })
    setEditingNotes(false)
  }

  const handleRescore = async () => {
    if (!lead) return

    setIsRescoring(true)
    try {
      const response = await fetch('/api/ai/score-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: lead.id })
      })

      if (response.ok) {
        const result = await response.json() as ScoreBuyerResponse
        console.log('[LeadDetail] Score result:', result)
        setScoreResult(result)
        await refreshData()
      } else {
        const errorData = await response.json()
        console.error('[LeadDetail] Score API error:', errorData)
        alert(`Scoring failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to score lead:', error)
      alert('Failed to score lead. Check console for details.')
    } finally {
      setIsRescoring(false)
    }
  }

  // Auto-score lead if it doesn't have scores yet
  useEffect(() => {
    // Early return if lead doesn't exist
    if (!lead) return

    // Check if lead is unscored (null means unscored, 0 is a valid score)
    const isUnscored = (lead.ai_quality_score === null || lead.ai_quality_score === undefined) &&
                       (lead.quality_score === null || lead.quality_score === undefined) &&
                       !lead.ai_scored_at

    const shouldAutoScore = !hasAutoScored &&
      !isRescoring &&
      !scoreResult &&
      isUnscored

    if (shouldAutoScore) {
      console.log('[LeadDetail] Auto-scoring lead:', lead.id)
      setHasAutoScored(true)
      setTimeout(() => {
        handleRescore()
      }, 500)
    }
  }, [lead, hasAutoScored, isRescoring, scoreResult])

  const handleArchive = async () => {
    if (!lead || !confirm('Archive this lead?')) return
    await updateLead(lead.id, { status: 'Not Proceeding' })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  // Show scoring indicator if auto-scoring on first load
  if (isRescoring && !scoreResult) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Link href="/admin/leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
            <h3 className="text-lg font-medium mb-2">AI is analyzing this lead...</h3>
            <p className="text-muted-foreground">Generating quality score, intent score, and recommendations</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/admin/leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Lead not found</h3>
            <p className="text-muted-foreground mb-4">The lead you are looking for does not exist.</p>
            <Button onClick={() => router.push('/admin/leads')}>Back to Leads</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Use score result if available, otherwise use stored values
  // Use null for unscored leads (will trigger auto-scoring)
  const qualityScore = scoreResult?.quality_score ?? lead.ai_quality_score ?? lead.quality_score
  const intentScore = scoreResult?.intent_score ?? lead.ai_intent_score ?? lead.intent_score
  const confidenceScore = scoreResult?.confidence ?? (lead.ai_confidence ? lead.ai_confidence * 10 : null)
  const classification = scoreResult?.classification ?? lead.ai_classification ?? 'Cold'
  const priority = scoreResult?.priority ?? lead.ai_priority ?? 'P4'
  const summary = scoreResult?.summary ?? lead.ai_summary
  const nextAction = scoreResult?.next_action ?? lead.ai_next_action
  const riskFlags = scoreResult?.risk_flags ?? lead.ai_risk_flags ?? []
  const recommendations = scoreResult?.recommendations ?? lead.ai_recommendations ?? []
  const scoreBreakdown = scoreResult?.score_breakdown

  // Helper to check if broker/solicitor has positive status
  const hasPositiveConnection = (status: string | boolean | undefined | null): boolean => {
    if (typeof status === 'boolean') return status
    return status === 'yes' || status === 'introduced'
  }

  // Generate explanation for why scores are what they are
  const getScoreExplanation = () => {
    const reasons: string[] = []

    // Quality factors
    if (lead.payment_method?.toLowerCase() === 'cash') reasons.push('Cash buyer (+15 quality)')
    if (lead.proof_of_funds) reasons.push('Proof of funds verified (+10 quality)')
    if (hasPositiveConnection(lead.uk_broker)) reasons.push('UK Broker connected (+8 quality)')
    if (hasPositiveConnection(lead.uk_solicitor)) reasons.push('UK Solicitor in place (+7 quality)')
    if (!lead.email && !lead.phone) reasons.push('Missing contact info (-10 quality)')

    // Intent factors
    if (lead.status === 'Viewing Booked' || lead.status === 'Negotiating') reasons.push('Active engagement (+25 intent)')
    if (lead.status === 'Reserved' || lead.status === 'Exchanged') reasons.push('Committed stage (+25 intent)')
    if (lead.timeline?.toLowerCase().includes('immediate') || lead.timeline?.toLowerCase().includes('asap')) reasons.push('Immediate timeline (+30 intent)')
    if (lead.status === 'Not Proceeding') reasons.push('Not proceeding (-50 intent)')

    return reasons
  }

  const scoreReasons = getScoreExplanation()

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/admin/leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="w-4 h-4 mr-1" /> Archive
            </Button>
          </div>
        </div>

        {/* Lead Name & Contact */}
        <div>
          <h1 className="text-3xl font-bold">
            {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
          </h1>
          <div className="flex flex-wrap gap-4 text-muted-foreground mt-1">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-foreground">
                <Mail className="w-4 h-4" /> {lead.email}
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-foreground">
                <Phone className="w-4 h-4" /> {lead.phone}
              </a>
            )}
            {lead.country && (
              <span className="flex items-center gap-1">
                <Globe className="w-4 h-4" /> {lead.country}
              </span>
            )}
          </div>
        </div>

        {/* Score Cards Row */}
        <div className="flex gap-4 items-start flex-wrap">
          <ScoreCard
            label="Quality Score"
            score={qualityScore}
            explanation="How qualified is this lead?"
          />
          <ScoreCard
            label="Intent Score"
            score={intentScore}
            explanation="How ready to buy?"
          />
          <ScoreCard
            label="Confidence"
            score={confidenceScore !== null ? Math.round(confidenceScore) : null}
            maxScore={10}
            explanation="AI certainty level"
          />
          <ClassificationBadge classification={classification} showExplanation />
        </div>

        {/* Priority + Rescore */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <PriorityBadge priority={priority} showExplanation />
          <Button variant="default" onClick={handleRescore} disabled={isRescoring}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRescoring ? 'animate-spin' : ''}`} />
            {isRescoring ? 'Scoring...' : 'Re-score with AI'}
          </Button>
        </div>

        {/* Score Reasons Summary */}
        {scoreReasons.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Why these scores?
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {scoreReasons.map((reason, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-1">
                  <span className="text-primary">•</span> {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Spam Warning */}
        {scoreResult?.is_spam && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">Potential Spam Detected</h4>
              <ul className="text-sm text-red-700 mt-1">
                {scoreResult.spam_flags.map((flag, i) => (
                  <li key={i}>• {flag}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          THREE COLUMN LAYOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 1 - AI INSIGHTS & ACTIONS
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* AI Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {summary || 'No AI summary available. Click "Re-score with AI" to generate.'}
              </p>
            </CardContent>
          </Card>

          {/* Next Action */}
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Recommended Next Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium mb-3">{nextAction || 'No action recommended'}</p>
              <div className="flex gap-2 flex-wrap">
                {lead.phone && (
                  <Button size="sm" asChild>
                    <a href={`tel:${lead.phone}`}>
                      <Phone className="w-4 h-4 mr-1" /> Call
                    </a>
                  </Button>
                )}
                {lead.email && (
                  <Button size="sm" variant="outline" onClick={() => setShowEmailComposer(true)}>
                    <Mail className="w-4 h-4 mr-1" /> Email
                  </Button>
                )}
                {lead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank">
                      <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risk Flags */}
          {riskFlags.length > 0 && (
            <Card className="border-yellow-500/50 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Flags ({riskFlags.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {riskFlags.map((flag, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Score Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scoreBreakdown ? (
                <>
                  <ScoreBreakdownSection
                    title="Quality Score"
                    items={[
                      { label: 'Profile Completeness', ...scoreBreakdown.quality.profileCompleteness },
                      { label: 'Financial Qualification', ...scoreBreakdown.quality.financialQualification },
                      { label: 'Verification Status', ...scoreBreakdown.quality.verificationStatus },
                      { label: 'Inventory Fit', ...scoreBreakdown.quality.inventoryFit },
                    ]}
                    isOpen={openBreakdown === 'quality'}
                    onToggle={() => setOpenBreakdown(openBreakdown === 'quality' ? null : 'quality')}
                  />
                  <ScoreBreakdownSection
                    title="Intent Score"
                    items={[
                      { label: 'Timeline', ...scoreBreakdown.intent.timeline },
                      { label: 'Purpose/Payment', ...scoreBreakdown.intent.purpose },
                      { label: 'Engagement', ...scoreBreakdown.intent.engagement },
                      { label: 'Commitment', ...scoreBreakdown.intent.commitment },
                      { label: 'Negative Modifiers', ...scoreBreakdown.intent.negativeModifiers },
                    ]}
                    isOpen={openBreakdown === 'intent'}
                    onToggle={() => setOpenBreakdown(openBreakdown === 'intent' ? null : 'intent')}
                  />
                  <ScoreBreakdownSection
                    title="Confidence Score"
                    items={[
                      { label: 'Data Completeness', ...scoreBreakdown.confidence.dataCompleteness },
                      { label: 'Verification Level', ...scoreBreakdown.confidence.verificationLevel },
                      { label: 'Engagement Data', ...scoreBreakdown.confidence.engagementData },
                      { label: 'Transcript Quality', ...scoreBreakdown.confidence.transcriptQuality },
                    ]}
                    isOpen={openBreakdown === 'confidence'}
                    onToggle={() => setOpenBreakdown(openBreakdown === 'confidence' ? null : 'confidence')}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Re-score to see detailed breakdown</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 2 - BUYER PROFILE & REQUIREMENTS
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Full Name" value={lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()} icon={User} />
              <DataRow label="First Name" value={lead.first_name} />
              <DataRow label="Last Name" value={lead.last_name} />
              <DataRow label="Email" value={lead.email} icon={Mail} />
              <DataRow label="Phone" value={lead.phone} icon={Phone} />
              <DataRow label="Country" value={lead.country} icon={Globe} />
            </CardContent>
          </Card>

          {/* Property Requirements */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Home className="w-4 h-4" />
                Property Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Budget" value={lead.budget_range || lead.budget} icon={DollarSign} />
              {(lead.budget_min || lead.budget_max) && (
                <DataRow
                  label="Budget Range"
                  value={`£${lead.budget_min?.toLocaleString() || '0'} - £${lead.budget_max?.toLocaleString() || '∞'}`}
                />
              )}
              <DataRow label="Bedrooms" value={lead.preferred_bedrooms || lead.bedrooms} icon={Home} />
              <DataRow label="Location" value={lead.location || lead.area} icon={MapPin} />
              <DataRow label="Timeline" value={lead.timeline} icon={Calendar} />
              <DataRow label="Purpose" value={lead.purpose} />
              <DataRow label="Ready in 28 Days" value={<BooleanIndicator value={lead.ready_in_28_days} />} />
            </CardContent>
          </Card>

          {/* Financial Qualification */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Qualification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Payment Method" value={<PaymentBadge method={lead.payment_method} />} />
              <DataRow label="Mortgage Status" value={lead.mortgage_status} />
              <DataRow label="Proof of Funds" value={<BooleanIndicator value={lead.proof_of_funds} />} />
              <EditableConnectionStatus
                label="UK Broker"
                value={lead.uk_broker}
                onChange={(newValue) => updateLead(lead.id, { uk_broker: newValue })}
              />
              <EditableConnectionStatus
                label="UK Solicitor"
                value={lead.uk_solicitor}
                onChange={(newValue) => updateLead(lead.id, { uk_solicitor: newValue })}
              />
            </CardContent>
          </Card>

          {/* Source & Campaign */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Source & Campaign
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Source" value={lead.source} />
              <DataRow label="Campaign/Development" value={lead.campaign} />
              <DataRow label="Campaign ID" value={lead.campaign_id ? lead.campaign_id.substring(0, 8) + '...' : '-'} icon={Hash} />
              <DataRow label="Company ID" value={lead.company_id ? lead.company_id.substring(0, 8) + '...' : '-'} icon={Building} />
            </CardContent>
          </Card>

          {/* Engagement & Communication */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Engagement & Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Viewing Intent" value={(lead as any).viewing_intent_confirmed ? <BooleanIndicator value={true} /> : <BooleanIndicator value={false} />} />
              <DataRow label="Viewing Booked" value={(lead as any).viewing_booked ? <BooleanIndicator value={true} /> : <BooleanIndicator value={false} />} />
              <DataRow label="Viewing Date" value={formatDate((lead as any).viewing_date)} icon={Calendar} />
              <DataRow label="Has Replied" value={(lead as any).replied ? <BooleanIndicator value={true} /> : <BooleanIndicator value={false} />} />
              <DataRow label="Stop Comms" value={(lead as any).stop_comms ? <BooleanIndicator value={true} /> : <BooleanIndicator value={false} />} />
              <DataRow label="Next Follow-up" value={formatDate((lead as any).next_follow_up)} icon={Clock} />
              <DataRow label="Broker Connected" value={(lead as any).broker_connected ? <BooleanIndicator value={true} /> : <BooleanIndicator value={false} />} />
            </CardContent>
          </Card>

          {/* Transcript / Call Summary */}
          {((lead as any).transcript || (lead as any).call_summary || (lead as any).last_wa_message) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Communication History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(lead as any).last_wa_message && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Last WhatsApp Message</div>
                    <div className="bg-muted rounded-lg p-3 text-sm">{(lead as any).last_wa_message}</div>
                  </div>
                )}
                {(lead as any).call_summary && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Call Summary</div>
                    <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">{(lead as any).call_summary}</div>
                  </div>
                )}
                {(lead as any).transcript && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Transcript</div>
                    <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{(lead as any).transcript}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 3 - STATUS, NOTES & HISTORY
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status & Assignment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Status & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Status</label>
                <select
                  value={lead.status || ''}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Assigned To</label>
                <select
                  value={lead.assigned_to || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {lead.assigned_user_name && (
                <DataRow label="Assigned User" value={lead.assigned_user_name} />
              )}
              {lead.assigned_at && (
                <DataRow label="Assigned At" value={formatDateTime(lead.assigned_at)} />
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </span>
                {!editingNotes && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={6}
                    className="text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveNotes}>
                      <Save className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-3 min-h-[100px] max-h-[300px] overflow-y-auto">
                  {lead.notes ? (
                    <pre className="text-sm whitespace-pre-wrap font-sans">{lead.notes}</pre>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No notes yet. Click edit to add.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Date Added" value={formatDateTime(lead.date_added || lead.created_at)} icon={Calendar} />
              <DataRow label="Last Updated" value={formatDateTime(lead.updated_at)} />
              <DataRow label="Last Contact" value={formatDateTime(lead.last_contact)} icon={Phone} />
              <DataRow label="Last AI Score" value={formatDateTime(lead.ai_scored_at)} icon={Bot} />
            </CardContent>
          </Card>

          {/* AI Classification Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-4 h-4" />
                AI Classification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Classification" value={lead.ai_classification || classification} />
              <DataRow label="Priority" value={lead.ai_priority || priority} />
              <DataRow label="Quality Score" value={lead.ai_quality_score ?? lead.quality_score ?? 0} />
              <DataRow label="Intent Score" value={lead.ai_intent_score ?? lead.intent_score ?? 0} />
              <DataRow label="Confidence" value={lead.ai_confidence ? `${(lead.ai_confidence * 100).toFixed(0)}%` : '-'} />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.status !== 'Viewing Booked' && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStatusChange('Viewing Booked')}
                >
                  <Calendar className="w-4 h-4 mr-2" /> Book Viewing
                </Button>
              )}
              {(!lead.uk_broker || lead.uk_broker === 'no' || lead.uk_broker === 'unknown') && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateLead(lead.id, { uk_broker: 'introduced' })}
                >
                  <Building className="w-4 h-4 mr-2" /> Refer to Broker
                </Button>
              )}
              {!lead.proof_of_funds && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateLead(lead.id, { proof_of_funds: true })}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark Funds Verified
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Lead ID */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Lead ID:</span>
                <code className="bg-muted px-2 py-1 rounded">{lead.id}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Email Composer Modal */}
      {lead.email && (
        <EmailComposer
          open={showEmailComposer}
          onOpenChange={setShowEmailComposer}
          recipientEmail={lead.email}
          recipientName={lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead'}
          leadId={lead.id}
          developmentName={lead.campaign}
        />
      )}
    </div>
  )
}
