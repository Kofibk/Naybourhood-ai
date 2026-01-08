'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/contexts/DataContext'
import { formatCurrency } from '@/lib/utils'
import type { FinanceLead } from '@/types'
import {
  ArrowLeft,
  Phone,
  Mail,
  User,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  PoundSterling,
  Briefcase,
  Building2,
  UserCheck,
  Archive,
  XCircle,
  MessageCircle,
} from 'lucide-react'

// Status options for finance leads
const FINANCE_STATUS_OPTIONS = ['Contact Pending', 'Follow-up', 'Awaiting Documents', 'Not Proceeding', 'Duplicate', 'Completed']
const FINANCE_TYPE_OPTIONS = ['Bridging Finance', 'Development Finance', 'Residential', 'Buy to let', 'Other']

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
  type?: 'text' | 'email' | 'tel' | 'number' | 'date'
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
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 group">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-2 py-1 w-40"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}><XCircle className="h-4 w-4 text-red-400" /></Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-right max-w-[50%] truncate">{value || '-'}</span>
          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}
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
  options: string[]
  onSave: (field: string, value: string) => void
  icon?: any
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <select
        value={value || ''}
        onChange={(e) => onSave(field, e.target.value)}
        className="text-sm bg-background border border-input rounded-md px-2 py-1 max-w-[180px]"
      >
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
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
      return [{ id: '1', text: notes, author: 'System', timestamp: new Date().toISOString() }]
    } catch {
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

export default function FinanceLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { financeLeads, companies, users, isLoading, updateFinanceLead } = useData()

  // Get broker companies for assignment
  const brokerCompanies = useMemo(() => {
    return companies.filter(c => c.type === 'broker' || c.type === 'Broker')
  }, [companies])

  // Get broker users (all users can be assigned for now)
  const brokerUsers = useMemo(() => {
    return users
  }, [users])

  // Helper to get company name by ID
  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Unassigned'
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unassigned'
  }

  const lead = useMemo(() => {
    return financeLeads.find((l) => l.id === params.id)
  }, [financeLeads, params.id])

  // Generic field save handler for editable fields
  const handleFieldSave = async (field: string, value: string | number | null) => {
    if (!lead) return
    await updateFinanceLead(lead.id, { [field]: value })
  }

  const handleStatusChange = async (status: string) => {
    if (!lead) return
    await updateFinanceLead(lead.id, { status })
  }

  const handleAssigneeChange = async (userId: string) => {
    if (!lead) return
    const user = users.find(u => u.id === userId)
    await updateFinanceLead(lead.id, {
      assigned_to: userId || undefined,
      assigned_agent: user?.name || undefined
    })
  }

  const handleCompanyChange = async (companyId: string) => {
    if (!lead) return
    await updateFinanceLead(lead.id, { company_id: companyId || undefined })
  }

  const handleArchive = async () => {
    if (!lead || !confirm('Archive this finance lead?')) return
    await updateFinanceLead(lead.id, { status: 'Not Proceeding' })
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

  // Calculate days until required
  const getDaysUntilRequired = () => {
    if (!lead?.required_by_date) return null
    const required = new Date(lead.required_by_date)
    const today = new Date()
    const diff = Math.ceil((required.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntil = getDaysUntilRequired()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/admin/finance-leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Finance Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">Finance lead not found</h3>
            <p className="text-muted-foreground mb-4">The finance lead you are looking for does not exist.</p>
            <Button onClick={() => router.push('/admin/finance-leads')}>Back to Finance Leads</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/admin/finance-leads" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Finance Leads
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
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Finance Type</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {lead.finance_type || 'N/A'}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <PoundSterling className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loan Amount</span>
              </div>
              <p className="text-xl font-bold">
                {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount) : 'N/A')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Required By</span>
              </div>
              <p className="text-sm font-bold">
                {formatDate(lead.required_by_date)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Days Until Required</span>
              </div>
              <p className={`text-sm font-bold ${
                daysUntil !== null && daysUntil < 0 ? 'text-destructive' :
                daysUntil !== null && daysUntil <= 7 ? 'text-warning' :
                'text-success'
              }`}>
                {daysUntil !== null ? (daysUntil < 0 ? `${Math.abs(daysUntil)} overdue` : `${daysUntil} days`) : 'N/A'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Assigned Agent</span>
              </div>
              <p className="text-sm font-medium truncate" title={lead.assigned_agent}>
                {lead.assigned_agent || 'Unassigned'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Broker Company</span>
              </div>
              <p className="text-sm font-medium truncate" title={getCompanyName(lead.company_id)}>
                {getCompanyName(lead.company_id)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          {lead.phone && (
            <Button size="sm" asChild>
              <a href={`tel:${lead.phone}`}>
                <Phone className="w-4 h-4 mr-1" /> Call
              </a>
            </Button>
          )}
          {lead.email && (
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:${lead.email}`}>
                <Mail className="w-4 h-4 mr-1" /> Email
              </a>
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          THREE COLUMN LAYOUT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 1 - CONTACT & FINANCE DETAILS
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
              <EditableTextField label="Email" value={lead.email} field="email" onSave={handleFieldSave} icon={Mail} type="email" />
              <EditableTextField label="Phone" value={lead.phone} field="phone" onSave={handleFieldSave} icon={Phone} type="tel" />
            </CardContent>
          </Card>

          {/* Finance Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Finance Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <EditableSelectField
                label="Finance Type"
                value={lead.finance_type}
                field="finance_type"
                options={FINANCE_TYPE_OPTIONS}
                onSave={handleFieldSave}
                icon={Briefcase}
              />
              <EditableTextField
                label="Loan Amount"
                value={lead.loan_amount}
                field="loan_amount"
                onSave={(f, v) => handleFieldSave(f, v ? parseFloat(v) : null)}
                icon={PoundSterling}
                type="number"
              />
              <EditableTextField
                label="Required By"
                value={lead.required_by_date}
                field="required_by_date"
                onSave={handleFieldSave}
                icon={Calendar}
                type="date"
              />
              <DataRow label="Date Added" value={formatDate(lead.date_added)} icon={Calendar} />
            </CardContent>
          </Card>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 2 - MESSAGE & NOTES
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Message */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Lead Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 min-h-[100px]">
                {lead.message || 'No message provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Notes & Comments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes & Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NotesComments
                notes={lead.notes}
                onSave={(notes) => updateFinanceLead(lead.id, { notes })}
                userName="Admin"
              />
            </CardContent>
          </Card>
        </div>

        {/* ─────────────────────────────────────────────────────────────────
            COLUMN 3 - STATUS & ASSIGNMENT
        ───────────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Status & Assignment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
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
                  <option value="">Select Status...</option>
                  {FINANCE_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Assigned Agent</label>
                <select
                  value={lead.assigned_to || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Unassigned</option>
                  {brokerUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Broker Company</label>
                <select
                  value={lead.company_id || ''}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Unassigned</option>
                  {brokerCompanies.length > 0 ? (
                    brokerCompanies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  ) : (
                    companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.status !== 'Follow-up' && lead.status !== 'Awaiting Documents' && lead.status !== 'Completed' && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStatusChange('Follow-up')}
                >
                  <Clock className="w-4 h-4 mr-2" /> Set Follow-up
                </Button>
              )}
              {lead.status !== 'Awaiting Documents' && lead.status !== 'Completed' && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStatusChange('Awaiting Documents')}
                >
                  <FileText className="w-4 h-4 mr-2" /> Request Documents
                </Button>
              )}
              {lead.status !== 'Completed' && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStatusChange('Completed')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
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
              <DataRow label="Required By" value={formatDate(lead.required_by_date)} icon={Calendar} />
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
    </div>
  )
}
