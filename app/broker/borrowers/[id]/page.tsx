'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
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
  PoundSterling,
  Briefcase,
  Clock,
  UserCheck,
  Building2,
  XCircle,
} from 'lucide-react'

const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow-up',
  'Awaiting Documents',
  'Processing',
  'Approved',
  'Not Proceeding',
  'Duplicate',
  'Completed',
]

const FINANCE_TYPE_OPTIONS = [
  'Bridging Finance',
  'Development Finance',
  'Residential',
  'Buy to let',
  'Commercial',
  'Other',
]

// Editable field component for inline editing
function EditableField({
  label,
  value,
  field,
  onSave,
  icon: Icon,
  type = 'text',
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

  useEffect(() => {
    setTempValue(String(value || ''))
  }, [value])

  const handleSave = () => {
    onSave(field, tempValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(String(value || ''))
    setEditing(false)
  }

  const formatDisplayValue = () => {
    if (!value) return '-'
    if (type === 'date') {
      return new Date(String(value)).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
    return String(value)
  }

  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0 group">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="h-8 w-44 text-sm"
            autoFocus
          />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave}>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCancel}>
            <XCircle className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-right max-w-[200px] truncate">
            {formatDisplayValue()}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity"
            onClick={() => setEditing(true)}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Editable select field
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
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
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
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function BrokerBorrowerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { financeLeads, isLoading, updateFinanceLead } = useData()

  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch company_id from localStorage or user_profiles
  useEffect(() => {
    const initializeCompany = async () => {
      let currentUser = user
      if (!currentUser) {
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) {
            currentUser = JSON.parse(stored)
          }
        } catch {
          /* ignore */
        }
      }

      if (!currentUser?.id) {
        setIsReady(true)
        return
      }

      if (currentUser.company_id) {
        setCompanyId(currentUser.company_id)
        setIsReady(true)
        return
      }

      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('id', currentUser.id)
          .single()

        if (profile?.company_id) {
          setCompanyId(profile.company_id)
        }
      }

      setIsReady(true)
    }

    initializeCompany()
  }, [user])

  const lead = useMemo(() => {
    const found = financeLeads.find((l) => l.id === params.id)
    // Allow viewing if lead belongs to user's company
    if (found && companyId && found.company_id === companyId) {
      return found
    }
    return null
  }, [financeLeads, params.id, companyId])

  // Handle inline field updates
  const handleFieldUpdate = async (field: string, value: string) => {
    if (!lead) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const updateData: Partial<FinanceLead> = { [field]: value }

      // Handle numeric fields
      if (field === 'loan_amount') {
        updateData.loan_amount = parseFloat(value) || 0
      }

      const result = await updateFinanceLead(lead.id, updateData)

      if (result) {
        setSaveMessage({ type: 'success', text: 'Updated successfully!' })
        setTimeout(() => setSaveMessage(null), 2000)
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update.' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred.' })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle notes update
  const handleNotesUpdate = async (notes: string) => {
    if (!lead) return

    setIsSaving(true)
    try {
      await updateFinanceLead(lead.id, { notes })
      setSaveMessage({ type: 'success', text: 'Notes saved!' })
      setTimeout(() => setSaveMessage(null), 2000)
    } catch {
      setSaveMessage({ type: 'error', text: 'Failed to save notes.' })
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Contact Pending':
        return 'warning'
      case 'Follow-up':
        return 'default'
      case 'Awaiting Documents':
        return 'secondary'
      case 'Processing':
        return 'default'
      case 'Approved':
        return 'success'
      case 'Not Proceeding':
        return 'destructive'
      case 'Duplicate':
        return 'muted'
      case 'Completed':
        return 'success'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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

  const daysUntil = lead ? getDaysUntilRequired() : null

  // Loading state
  if (!isReady || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Not found or access denied
  if (!lead) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Borrower not found or you don&apos;t have access.</p>
            <Button variant="link" onClick={() => router.push('/broker/borrowers')}>
              Return to Borrowers
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/broker/borrowers')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display">
                {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
              </h1>
              <Badge variant={getStatusColor(lead.status) as any}>{lead.status || 'Unknown'}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Added {formatDate(lead.date_added || lead.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => lead.phone && window.open(`tel:${lead.phone}`)}>
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          <Button size="sm" variant="outline" onClick={() => lead.email && window.open(`mailto:${lead.email}`)}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 ${
            saveMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}
        >
          {saveMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
            <p className="text-sm font-bold">{formatDate(lead.required_by_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Days Left</span>
            </div>
            <p
              className={`text-sm font-bold ${
                daysUntil !== null && daysUntil < 0
                  ? 'text-destructive'
                  : daysUntil !== null && daysUntil <= 7
                    ? 'text-warning'
                    : 'text-success'
              }`}
            >
              {daysUntil !== null ? (daysUntil < 0 ? `${Math.abs(daysUntil)} overdue` : `${daysUntil} days`) : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Assigned To</span>
            </div>
            <p className="text-sm font-medium truncate">{lead.assigned_agent || 'Unassigned'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Date Added</span>
            </div>
            <p className="text-sm font-medium">{formatDate(lead.date_added)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information - Inline Editable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableField
              label="Full Name"
              value={lead.full_name}
              field="full_name"
              onSave={handleFieldUpdate}
              icon={User}
            />
            <EditableField
              label="Email"
              value={lead.email}
              field="email"
              onSave={handleFieldUpdate}
              type="email"
              icon={Mail}
            />
            <EditableField
              label="Phone"
              value={lead.phone}
              field="phone"
              onSave={handleFieldUpdate}
              type="tel"
              icon={Phone}
            />
            <EditableSelectField
              label="Status"
              value={lead.status}
              field="status"
              options={STATUS_OPTIONS}
              onSave={handleFieldUpdate}
            />
          </CardContent>
        </Card>

        {/* Finance Details - Inline Editable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Finance Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableSelectField
              label="Finance Type"
              value={lead.finance_type}
              field="finance_type"
              options={FINANCE_TYPE_OPTIONS}
              onSave={handleFieldUpdate}
              icon={Briefcase}
            />
            <EditableField
              label="Loan Amount"
              value={lead.loan_amount}
              field="loan_amount"
              onSave={handleFieldUpdate}
              type="number"
              icon={PoundSterling}
            />
            <EditableField
              label="Required By"
              value={lead.required_by_date}
              field="required_by_date"
              onSave={handleFieldUpdate}
              type="date"
              icon={Calendar}
            />
            <EditableField
              label="Assigned Agent"
              value={lead.assigned_agent}
              field="assigned_agent"
              onSave={handleFieldUpdate}
              icon={UserCheck}
            />
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Lead Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {lead.message || 'No message provided.'}
            </p>
          </CardContent>
        </Card>

        {/* Notes - Editable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
              <span className="text-xs text-muted-foreground ml-auto">Click to edit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotesEditor notes={lead.notes} onSave={handleNotesUpdate} isSaving={isSaving} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => lead.phone && window.open(`tel:${lead.phone}`)}>
              <Phone className="h-4 w-4 mr-2" />
              Call {lead.full_name?.split(' ')[0] || 'Client'}
            </Button>
            <Button variant="outline" onClick={() => lead.email && window.open(`mailto:${lead.email}`)}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button
              variant="outline"
              onClick={() => handleFieldUpdate('status', 'Follow-up')}
              disabled={lead.status === 'Follow-up'}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark for Follow-up
            </Button>
            <Button
              variant="outline"
              onClick={() => handleFieldUpdate('status', 'Awaiting Documents')}
              disabled={lead.status === 'Awaiting Documents'}
            >
              <FileText className="h-4 w-4 mr-2" />
              Request Documents
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Created: {formatDate(lead.created_at)}</span>
            {lead.updated_at && <span>Last Updated: {formatDate(lead.updated_at)}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Notes editor component
function NotesEditor({
  notes,
  onSave,
  isSaving,
}: {
  notes: string | undefined | null
  onSave: (notes: string) => void
  isSaving: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempNotes, setTempNotes] = useState(notes || '')

  useEffect(() => {
    setTempNotes(notes || '')
  }, [notes])

  const handleSave = () => {
    onSave(tempNotes)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          value={tempNotes}
          onChange={(e) => setTempNotes(e.target.value)}
          placeholder="Add notes about this borrower..."
          rows={5}
          className="text-sm"
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-[100px] p-3 rounded-md bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => setIsEditing(true)}
    >
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {notes || 'Click to add notes...'}
      </p>
    </div>
  )
}
