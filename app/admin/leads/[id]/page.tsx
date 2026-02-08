'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/contexts/DataContext'
import { EmailComposer } from '@/components/EmailComposer'
import { ConversationThread } from '@/components/ConversationThread'
import type { Buyer } from '@/types'
import type { ScoreBuyerResponse } from '@/app/api/ai/score-buyer/route'
import {
  STATUS_OPTIONS,
  CLASSIFICATION_CONFIG,
  PRIORITY_CONFIG,
  CONNECTION_STATUS_OPTIONS,
  parseBudgetRange,
  formatBudgetValue,
  formatDate,
  formatDateTime,
} from '@/lib/leadUtils'
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
} from 'lucide-react'


// Editable Text Field Component
function EditableTextField({
  label,
  value,
  field,
  onSave,
  icon: Icon,
  type = 'text'
}: {
  label: string
  value: string | number | null | undefined
  field: string
  onSave: (field: string, value: string) => void
  icon?: any
  type?: 'text' | 'email' | 'tel' | 'number'
}) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value || ''))

  const handleSave = () => {
    onSave(field, tempValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(String(value || ''))
    setEditing(false)
  }

  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 group gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-2 py-1 w-full max-w-[200px]"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}><XCircle className="h-4 w-4 text-red-400" /></Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-sm font-medium text-right break-words">{value || '-'}</span>
          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Editable Boolean Field Component
function EditableBooleanField({
  label,
  value,
  field,
  onSave,
}: {
  label: string
  value: boolean | undefined | null
  field: string
  onSave: (field: string, value: boolean) => void
}) {
  const isTrue = Boolean(value)

  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">{label}</span>
      <button
        onClick={() => onSave(field, !isTrue)}
        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors flex-shrink-0 ${
          isTrue
            ? 'text-green-600 hover:bg-green-50'
            : 'text-red-400 hover:bg-red-50'
        }`}
      >
        {isTrue ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {isTrue ? 'Yes' : 'No'}
      </button>
    </div>
  )
}

// Editable Select Field Component
function EditableSelectField({
  label,
  value,
  field,
  options,
  onSave,
  icon: Icon,
}: {
  label: string
  value: string | undefined | null
  field: string
  options: { value: string; label: string }[]
  onSave: (field: string, value: string) => void
  icon?: any
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <select
        value={value || ''}
        onChange={(e) => onSave(field, e.target.value)}
        className="text-sm bg-background border border-input rounded-md px-2 py-1 min-w-0 max-w-[220px]"
      >
        <option value="">-</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// Comment type for notes
interface Comment {
  id: string
  text: string
  author: string
  timestamp: string
}

// Notes/Comments Component
function NotesComments({
  notes,
  onSave,
  userName = 'Admin'
}: {
  notes: string | null | undefined
  onSave: (notes: string) => void
  userName?: string
}) {
  const [newComment, setNewComment] = useState('')

  // Parse existing notes as comments (JSON array) or convert legacy text
  const parseComments = (): Comment[] => {
    if (!notes) return []
    try {
      const parsed = JSON.parse(notes)
      if (Array.isArray(parsed)) return parsed
      // Legacy text format - convert to single comment
      return [{ id: '1', text: notes, author: 'System', timestamp: new Date().toISOString() }]
    } catch {
      // Legacy text format
      if (notes.trim()) {
        return [{ id: '1', text: notes, author: 'Imported', timestamp: new Date().toISOString() }]
      }
      return []
    }
  }

  const comments = parseComments()

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: userName,
      timestamp: new Date().toISOString()
    }

    const updatedComments = [...comments, newCommentObj]
    onSave(JSON.stringify(updatedComments))
    setNewComment('')
  }

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-3">
      {/* Existing Comments */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-primary">{comment.author}</span>
                <span className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Add New Comment */}
      <div className="border-t pt-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="text-sm mb-2"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
            <MessageSquare className="w-4 h-4 mr-1" /> Add Comment
          </Button>
        </div>
      </div>
    </div>
  )
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
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">{label}</span>
      <select
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-background border border-input rounded-md px-2 py-1 min-w-0 max-w-[220px]"
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
    <div className="flex justify-between items-start py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-2 flex-shrink-0">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-right break-words">{value || '-'}</span>
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
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  const lead = useMemo(() => {
    return leads.find((l) => l.id === params.id)
  }, [leads, params.id])

  const handleStatusChange = async (status: string) => {
    if (!lead) return
    await updateLead(lead.id, { status })
  }

  const handleAssigneeChange = async (assignee: string) => {
    if (!lead) return
    await updateLead(lead.id, { assigned_to: assignee })
  }

  const handleRescore = useCallback(async () => {
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
  }, [lead, refreshData])

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
  }, [lead, hasAutoScored, isRescoring, scoreResult, handleRescore])

  const handleArchive = async () => {
    if (!lead || !confirm('Archive this lead?')) return
    await updateLead(lead.id, { status: 'Not Proceeding' })
  }

  // Generic field save handler for editable fields
  const handleFieldSave = async (field: string, value: string | boolean | number | null) => {
    if (!lead) return
    await updateLead(lead.id, { [field]: value })
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
  // ai_confidence is stored as 0-100 (e.g., 30 means 30%)
  const confidenceScore = scoreResult?.confidence ?? lead.ai_confidence ?? null
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
            maxScore={100}
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
                (() => {
                  // Cast to any to handle both Naybourhood (array) and legacy (object) formats
                  const breakdown = scoreBreakdown as any
                  return (
                    <>
                      <ScoreBreakdownSection
                        title="Quality Score"
                        items={
                          Array.isArray(breakdown.quality?.breakdown)
                            ? breakdown.quality.breakdown.map((item: { factor: string; points: number; reason: string }) => ({
                                label: item.factor,
                                score: item.points,
                                maxScore: Math.abs(item.points) || 10,
                                details: [item.reason]
                              }))
                            : [
                                { label: 'Profile Completeness', ...breakdown.quality?.profileCompleteness },
                                { label: 'Financial Qualification', ...breakdown.quality?.financialQualification },
                                { label: 'Verification Status', ...breakdown.quality?.verificationStatus },
                                { label: 'Inventory Fit', ...breakdown.quality?.inventoryFit },
                              ].filter((item: any) => item.score !== undefined)
                        }
                        isOpen={openBreakdown === 'quality'}
                        onToggle={() => setOpenBreakdown(openBreakdown === 'quality' ? null : 'quality')}
                      />
                      <ScoreBreakdownSection
                        title="Intent Score"
                        items={
                          Array.isArray(breakdown.intent?.breakdown)
                            ? breakdown.intent.breakdown.map((item: { factor: string; points: number; reason: string }) => ({
                                label: item.factor,
                                score: item.points,
                                maxScore: Math.abs(item.points) || 10,
                                details: [item.reason]
                              }))
                            : [
                                { label: 'Timeline', ...breakdown.intent?.timeline },
                                { label: 'Purpose/Payment', ...breakdown.intent?.purpose },
                                { label: 'Engagement', ...breakdown.intent?.engagement },
                                { label: 'Commitment', ...breakdown.intent?.commitment },
                                { label: 'Negative Modifiers', ...breakdown.intent?.negativeModifiers },
                              ].filter((item: any) => item.score !== undefined)
                        }
                        isOpen={openBreakdown === 'intent'}
                        onToggle={() => setOpenBreakdown(openBreakdown === 'intent' ? null : 'intent')}
                      />
                      <ScoreBreakdownSection
                        title="Confidence Score"
                        items={
                          Array.isArray(breakdown.confidence?.breakdown)
                            ? breakdown.confidence.breakdown.map((item: { factor: string; points: number; reason: string }) => ({
                                label: item.factor,
                                score: item.points,
                                maxScore: Math.abs(item.points) || 10,
                                details: [item.reason]
                              }))
                            : [
                                { label: 'Data Completeness', ...breakdown.confidence?.dataCompleteness },
                                { label: 'Verification Level', ...breakdown.confidence?.verificationLevel },
                                { label: 'Engagement Data', ...breakdown.confidence?.engagementData },
                                { label: 'Transcript Quality', ...breakdown.confidence?.transcriptQuality },
                              ].filter((item: any) => item.score !== undefined)
                        }
                        isOpen={openBreakdown === 'confidence'}
                        onToggle={() => setOpenBreakdown(openBreakdown === 'confidence' ? null : 'confidence')}
                      />
                    </>
                  )
                })()
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
              <EditableTextField label="Full Name" value={lead.full_name} field="full_name" onSave={handleFieldSave} icon={User} />
              <EditableTextField label="First Name" value={lead.first_name} field="first_name" onSave={handleFieldSave} />
              <EditableTextField label="Last Name" value={lead.last_name} field="last_name" onSave={handleFieldSave} />
              <EditableTextField label="Email" value={lead.email} field="email" onSave={handleFieldSave} icon={Mail} type="email" />
              <EditableTextField label="Phone" value={lead.phone} field="phone" onSave={handleFieldSave} icon={Phone} type="tel" />
              <EditableTextField label="Country" value={lead.country} field="country" onSave={handleFieldSave} icon={Globe} />
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
              {(() => {
                // Parse budget range to auto-populate min/max if not set
                const parsedBudget = parseBudgetRange(lead.budget_range || lead.budget)
                const minBudget = lead.budget_min || parsedBudget.min
                const maxBudget = lead.budget_max || parsedBudget.max

                return (
                  <>
                    <EditableTextField label="Budget" value={lead.budget_range || lead.budget} field="budget_range" onSave={handleFieldSave} icon={DollarSign} />
                    <DataRow label="Min Budget" value={formatBudgetValue(minBudget)} />
                    <DataRow label="Max Budget" value={formatBudgetValue(maxBudget)} />
                  </>
                )
              })()}
              <EditableSelectField
                label="Bedrooms"
                value={String(lead.preferred_bedrooms || lead.bedrooms || '')}
                field="preferred_bedrooms"
                onSave={handleFieldSave}
                icon={Home}
                options={[
                  { value: 'Studio', label: 'Studio' },
                  { value: '1', label: '1 Bedroom' },
                  { value: '2', label: '2 Bedrooms' },
                  { value: '3', label: '3 Bedrooms' },
                  { value: '4', label: '4 Bedrooms' },
                  { value: '5+', label: '5+ Bedrooms' },
                ]}
              />
              <EditableTextField label="Location" value={lead.preferred_location || lead.location || lead.area} field="preferred_location" onSave={handleFieldSave} icon={MapPin} />
              <EditableSelectField
                label="Timeline"
                value={lead.timeline_to_purchase || lead.timeline}
                field="timeline_to_purchase"
                onSave={handleFieldSave}
                icon={Calendar}
                options={[
                  { value: 'Immediately', label: 'Immediately' },
                  { value: 'Within 1 month', label: 'Within 1 month' },
                  { value: 'Within 3 months', label: 'Within 3 months' },
                  { value: 'Within 6 months', label: 'Within 6 months' },
                  { value: 'Within 12 months', label: 'Within 12 months' },
                  { value: '12+ months', label: '12+ months' },
                  { value: 'Just browsing', label: 'Just browsing' },
                ]}
              />
              <EditableSelectField
                label="Purpose"
                value={lead.purchase_purpose || lead.purpose}
                field="purchase_purpose"
                onSave={handleFieldSave}
                options={[
                  { value: 'Investment', label: 'Investment' },
                  { value: 'Residence', label: 'Residence' },
                  { value: 'Both', label: 'Both' },
                ]}
              />
              <EditableBooleanField label="Ready in 28 Days" value={lead.ready_within_28_days || lead.ready_in_28_days} field="ready_within_28_days" onSave={handleFieldSave} />
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
              <EditableSelectField
                label="Payment Method"
                value={lead.payment_method}
                field="payment_method"
                onSave={handleFieldSave}
                icon={DollarSign}
                options={[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Mortgage', label: 'Mortgage' },
                  { value: 'Cash & Mortgage', label: 'Cash & Mortgage' },
                ]}
              />
              <EditableSelectField
                label="Mortgage Status"
                value={lead.mortgage_status}
                field="mortgage_status"
                onSave={handleFieldSave}
                options={[
                  { value: 'Pre-approved', label: 'Pre-approved' },
                  { value: 'In process', label: 'In process' },
                  { value: 'Not started', label: 'Not started' },
                  { value: 'N/A - Cash buyer', label: 'N/A - Cash buyer' },
                ]}
              />
              <EditableBooleanField label="Proof of Funds" value={lead.proof_of_funds} field="proof_of_funds" onSave={handleFieldSave} />
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
              <EditableTextField label="Source" value={lead.source_platform || lead.source} field="source_platform" onSave={handleFieldSave} />
              <EditableTextField label="Campaign/Development" value={lead.source_campaign || lead.campaign || lead.development_name} field="source_campaign" onSave={handleFieldSave} />
              <EditableTextField label="Development Name" value={lead.development_name} field="development_name" onSave={handleFieldSave} icon={Building} />
              <EditableTextField label="Enquiry Type" value={lead.enquiry_type} field="enquiry_type" onSave={handleFieldSave} />
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
              <EditableBooleanField label="Viewing Intent" value={(lead as any).viewing_intent_confirmed} field="viewing_intent_confirmed" onSave={handleFieldSave} />
              <EditableBooleanField label="Viewing Booked" value={(lead as any).viewing_booked} field="viewing_booked" onSave={handleFieldSave} />
              <EditableTextField label="Viewing Date" value={(lead as any).viewing_date} field="viewing_date" onSave={handleFieldSave} icon={Calendar} />
              <EditableBooleanField label="Has Replied" value={(lead as any).replied} field="replied" onSave={handleFieldSave} />
              <EditableBooleanField label="Stop Comms" value={(lead as any).stop_agent_communication || (lead as any).stop_comms} field="stop_agent_communication" onSave={handleFieldSave} />
              <EditableTextField label="Next Follow-up" value={(lead as any).next_follow_up} field="next_follow_up" onSave={handleFieldSave} icon={Clock} />
              <EditableBooleanField label="Broker Connected" value={(lead as any).connect_to_broker || (lead as any).broker_connected} field="connect_to_broker" onSave={handleFieldSave} />
            </CardContent>
          </Card>

          {/* WhatsApp Conversation Thread */}
          <ConversationThread
            buyerId={lead.id}
            buyerName={lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead'}
            buyerPhone={lead.phone}
            channel="whatsapp"
            maxHeight="400px"
          />

          {/* Call Summary & Transcript */}
          {((lead as any).transcript || (lead as any).call_summary) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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

          {/* Notes & Comments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotesComments
                notes={lead.notes}
                onSave={(notes) => updateLead(lead.id, { notes })}
                userName="Admin"
              />
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
              <DataRow label="Confidence" value={lead.ai_confidence ? `${lead.ai_confidence}%` : '-'} />
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
