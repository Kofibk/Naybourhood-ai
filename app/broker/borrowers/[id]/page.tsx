'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { FinanceLead } from '@/types'
import { KycVerificationBanner, KycStatusBadge } from '@/components/kyc/KycVerificationBanner'
import { useKycCheck } from '@/hooks/useKycCheck'
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
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 group">
      <span className="text-sm text-white/40 flex items-center gap-2">
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
          <span className="text-sm font-medium text-white text-right max-w-[200px] truncate">
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
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/40 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <select
        value={value || ''}
        onChange={(e) => onSave(field, e.target.value)}
        className="text-sm bg-white/5 border border-white/10 rounded-md px-2 py-1 max-w-[180px] text-white"
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
  const { financeLeads, isLoading, updateFinanceLead } = useFinanceLeads()

  const [companyId, setCompanyId] = useState<string | undefined>(undefined)
  const [isReady, setIsReady] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { kycCheck } = useKycCheck(params.id as string)

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
      <div className="space-y-6">
        {/* Back button skeleton */}
        <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-3 w-16 bg-white/10 rounded" />
                <div className="h-6 w-20 bg-white/10 rounded" />
              </div>
            </div>
          ))}
        </div>
        {/* Content skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-5">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-28 bg-white/10 rounded" />
                <div className="h-10 w-full bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Not found or access denied
  if (!lead) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="bg-[#111111] border border-white/10 rounded-xl py-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Borrower not found</h3>
          <p className="text-white/50 mb-4">Borrower not found or you don&apos;t have access.</p>
          <Button variant="link" onClick={() => router.push('/broker/borrowers')} className="text-white/50 hover:text-white">
            Return to Borrowers
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/broker/borrowers')} className="text-white/40 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display text-white">
                {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
              </h1>
              <Badge variant={getStatusColor(lead.status) as any}>{lead.status || 'Unknown'}</Badge>
            </div>
            <p className="text-sm text-white/50">Added {formatDate(lead.date_added || lead.created_at)}</p>
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

      {/* KYC Verification Banner */}
      <KycVerificationBanner buyerId={lead.id} />

      {/* Borrower Profile Summary */}
      <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-emerald-400">
              {(lead.full_name || lead.first_name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-lg font-semibold text-white">
                {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
              </h2>
              <Badge variant={getStatusColor(lead.status) as any}>{lead.status || 'Unknown'}</Badge>
              {kycCheck && <KycStatusBadge status={kycCheck.status} />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
              {lead.email && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.finance_type && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.finance_type}</span>
                </div>
              )}
              {(lead.loan_amount || lead.loan_amount_display) && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <PoundSterling className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount) : '')}</span>
                </div>
              )}
              {lead.assigned_agent && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <UserCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{lead.assigned_agent}</span>
                </div>
              )}
              {lead.required_by_date && (
                <div className="flex items-center gap-1.5 text-white/50">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Required by {formatDate(lead.required_by_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 ${
            saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
          }`}
        >
          {saveMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Finance Type</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {lead.finance_type || 'N/A'}
            </Badge>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Loan Amount</span>
            </div>
            <p className="text-xl font-bold text-white">
              {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount) : 'N/A')}
            </p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Required By</span>
            </div>
            <p className="text-sm font-bold text-white">{formatDate(lead.required_by_date)}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Days Left</span>
            </div>
            <p
              className={`text-sm font-bold ${
                daysUntil !== null && daysUntil < 0
                  ? 'text-red-400'
                  : daysUntil !== null && daysUntil <= 7
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            >
              {daysUntil !== null ? (daysUntil < 0 ? `${Math.abs(daysUntil)} overdue` : `${daysUntil} days`) : 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Assigned To</span>
            </div>
            <p className="text-sm font-medium text-white truncate">{lead.assigned_agent || 'Unassigned'}</p>
          </div>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Date Added</span>
            </div>
            <p className="text-sm font-medium text-white">{formatDate(lead.date_added)}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information - Inline Editable */}
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </h3>
          </div>
          <div className="p-5">
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
          </div>
        </div>

        {/* Finance Details - Inline Editable */}
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Finance Details
            </h3>
          </div>
          <div className="p-5">
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
          </div>
        </div>

        {/* Message */}
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Lead Message
            </h3>
          </div>
          <div className="p-5">
            <p className="text-sm text-white/50 whitespace-pre-wrap">
              {lead.message || 'No message provided.'}
            </p>
          </div>
        </div>

        {/* Notes - Editable */}
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-5 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
              <span className="text-xs text-white/40 ml-auto">Click to edit</span>
            </h3>
          </div>
          <div className="p-5">
            <NotesEditor notes={lead.notes} onSave={handleNotesUpdate} isSaving={isSaving} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold text-white text-sm">Quick Actions</h3>
        </div>
        <div className="p-5">
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
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4">
          <div className="flex items-center gap-6 text-xs text-white/40">
            <span>Created: {formatDate(lead.created_at)}</span>
            {lead.updated_at && <span>Last Updated: {formatDate(lead.updated_at)}</span>}
          </div>
        </div>
      </div>
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
      className="min-h-[100px] p-3 rounded-md bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
      onClick={() => setIsEditing(true)}
    >
      <p className="text-sm text-white/50 whitespace-pre-wrap">
        {notes || 'Click to add notes...'}
      </p>
    </div>
  )
}
