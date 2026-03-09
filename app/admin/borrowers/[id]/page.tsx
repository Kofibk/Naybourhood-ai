'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useFinanceLeads } from '@/hooks/useFinanceLeads'
import { useCompanies } from '@/hooks/useCompanies'
import { formatCurrency } from '@/lib/utils'
import type { FinanceLead } from '@/types'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  User,
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
  Pencil,
} from 'lucide-react'

// ─── Status Configuration ─────────────────────────────────────────────────────

const STATUS_OPTIONS = ['Contact Pending', 'Follow-up', 'Awaiting Documents', 'Not Proceeding', 'Duplicate', 'Completed']
const FINANCE_TYPE_OPTIONS = ['Bridging Finance', 'Development Finance', 'Residential', 'Buy to let', 'Other']

const STATUS_CONFIG: Record<string, { variant: string; color: string }> = {
  'Contact Pending': { variant: 'warning', color: 'text-amber-400' },
  'Follow-up': { variant: 'default', color: 'text-blue-400' },
  'Awaiting Documents': { variant: 'secondary', color: 'text-purple-400' },
  'Not Proceeding': { variant: 'destructive', color: 'text-red-400' },
  'Duplicate': { variant: 'outline', color: 'text-gray-400' },
  'Completed': { variant: 'success', color: 'text-emerald-400' },
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children, accentColor }: { title: string; icon: any; children: React.ReactNode; accentColor?: string }) {
  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 pb-2">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Icon className={`w-4 h-4 ${accentColor || 'text-white/50'}`} />
          {title}
        </h3>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  )
}

function EditableField({
  label,
  value,
  field,
  onSave,
  type = 'text',
  options,
  displayValue,
  inputClassName,
}: {
  label: string
  value: string | number | undefined | null
  field: string
  onSave: (field: string, value: string | number | undefined) => Promise<void>
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'textarea'
  options?: { value: string; label: string }[]
  displayValue?: React.ReactNode
  inputClassName?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string>(String(value ?? ''))
  const [isSaving, setIsSaving] = useState(false)

  const handleStartEdit = () => {
    setEditValue(String(value ?? ''))
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(String(value ?? ''))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saveValue = type === 'number' ? (editValue ? parseFloat(editValue) : undefined) : (editValue || undefined)
      await onSave(field, saveValue)
      setIsEditing(false)
    } catch (error) {
      console.error(`[EditableField] Error saving ${field}:`, error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <span className="text-sm text-white/50 flex-shrink-0 mr-3">{label}</span>
        <div className="flex items-center gap-2">
          {type === 'select' && options ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`px-2 py-1 rounded-md border bg-[#111111] border-white/10 text-white text-sm ${inputClassName || ''}`}
            >
              <option value="">Select...</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`w-full min-h-[100px] p-2 rounded-md border bg-[#111111] border-white/10 text-white text-sm resize-y placeholder:text-white/40 ${inputClassName || ''}`}
            />
          ) : (
            <Input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`max-w-[200px] h-8 bg-[#111111] border-white/10 text-white ${inputClassName || ''}`}
            />
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded hover:bg-white/10 text-emerald-400 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 rounded hover:bg-white/10 text-white/40"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group">
      <span className="text-sm text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        {displayValue ?? (
          <span className="text-sm font-medium text-white">{String(value ?? 'N/A') || 'N/A'}</span>
        )}
        <button
          onClick={handleStartEdit}
          className="p-1 rounded hover:bg-white/10 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function EditableTextarea({
  label,
  value,
  field,
  onSave,
  placeholder,
}: {
  label?: string
  value: string | undefined | null
  field: string
  onSave: (field: string, value: string | undefined) => Promise<void>
  placeholder?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string>(String(value ?? ''))
  const [isSaving, setIsSaving] = useState(false)

  const handleStartEdit = () => {
    setEditValue(String(value ?? ''))
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue(String(value ?? ''))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(field, editValue || undefined)
      setIsEditing(false)
    } catch (error) {
      console.error(`[EditableTextarea] Error saving ${field}:`, error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full min-h-[120px] p-2 rounded-md border bg-[#111111] border-white/10 text-white text-sm resize-y placeholder:text-white/40"
          placeholder={placeholder}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50"
          >
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/5 text-white/50 hover:bg-white/10"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <p className="text-sm text-white/50 whitespace-pre-wrap">
        {value || placeholder || 'Nothing added yet.'}
      </p>
      <button
        onClick={handleStartEdit}
        className="absolute top-0 right-0 p-1 rounded hover:bg-white/10 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinanceLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { companies } = useCompanies()
  const { financeLeads, isLoading, updateFinanceLead } = useFinanceLeads()

  // Get broker companies for assignment
  const brokerCompanies = useMemo(() => {
    return companies.filter(c => c.type === 'broker' || c.type === 'Broker')
  }, [companies])

  // Helper to get company name by ID
  const getCompanyName = (companyId?: string) => {
    if (!companyId) return 'Unassigned'
    const company = companies.find(c => c.id === companyId)
    return company?.name || 'Unassigned'
  }

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const lead = useMemo(() => {
    return financeLeads.find((l) => l.id === params.id)
  }, [financeLeads, params.id])

  // Generic field save handler for inline editing
  const handleFieldSave = async (field: string, value: string | number | boolean | undefined | null) => {
    if (!lead) return
    setSaveMessage(null)
    try {
      const result = await updateFinanceLead(lead.id, { [field]: value })
      if (result) {
        setSaveMessage({ type: 'success', text: 'Updated successfully!' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update. Please try again.' })
      }
    } catch (error) {
      console.error('[BorrowerDetail] Save error for field:', field, error)
      setSaveMessage({ type: 'error', text: 'An error occurred while saving.' })
    }
  }

  // ─── Loading State ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-white/50">Loading...</p>
      </div>
    )
  }

  // ─── Not Found State ────────────────────────────────────────────────────────

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/admin/borrowers" className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Borrowers
        </Link>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="py-12 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Borrower not found</h3>
            <p className="text-white/50 mb-4">The borrower you are looking for does not exist.</p>
            <Button onClick={() => router.push('/admin/borrowers')}>Back to Borrowers</Button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Computed Values ────────────────────────────────────────────────────────

  const displayName = lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'
  const statusConfig = STATUS_CONFIG[lead.status || ''] || { variant: 'outline', color: 'text-gray-400' }

  // Calculate days until required
  const getDaysUntilRequired = () => {
    if (!lead.required_by_date) return null
    const required = new Date(lead.required_by_date)
    const today = new Date()
    const diff = Math.ceil((required.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntil = getDaysUntilRequired()

  const getDaysUntilColor = () => {
    if (daysUntil === null) return 'text-white/50'
    if (daysUntil < 0) return 'text-red-400'
    if (daysUntil <= 7) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const getDaysUntilText = () => {
    if (daysUntil === null) return 'N/A'
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue`
    return `${daysUntil} days`
  }

  // Company options for broker select
  const companyOptions = (brokerCompanies.length > 0 ? brokerCompanies : companies).map(c => ({
    value: c.id,
    label: c.name ?? '',
  }))

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Save Message Toast */}
      {saveMessage && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <div>
        <Link href="/admin/borrowers" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Borrowers
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <Badge variant={statusConfig.variant as any}>
                {lead.status || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {lead.email}
                </span>
              )}
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {lead.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Added {formatDate(lead.created_at)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {lead.phone && (
              <a href={`tel:${lead.phone}`}>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}>
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
              </a>
            )}
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. KEY INFO HERO BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
            <p className="text-sm font-bold text-white">
              {formatDate(lead.required_by_date)}
            </p>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Days Until Required</span>
            </div>
            <p className={`text-sm font-bold ${getDaysUntilColor()}`}>
              {getDaysUntilText()}
            </p>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Status</span>
            </div>
            <span className={`text-sm font-semibold ${statusConfig.color}`}>
              {lead.status || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="h-4 w-4 text-white/50" />
              <span className="text-xs text-white/50">Assigned Agent</span>
            </div>
            <p className="text-sm font-medium text-white truncate" title={lead.assigned_agent}>
              {lead.assigned_agent || 'Unassigned'}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          3. TWO-COLUMN GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ─── Column 1 ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Contact Information */}
          <SectionCard title="Contact Information" icon={User} accentColor="text-blue-400">
            <div className="space-y-0">
              <EditableField
                label="Full Name"
                value={lead.full_name}
                field="full_name"
                onSave={handleFieldSave}
              />
              <EditableField
                label="Email"
                value={lead.email}
                field="email"
                onSave={handleFieldSave}
                type="email"
              />
              <EditableField
                label="Phone"
                value={lead.phone}
                field="phone"
                onSave={handleFieldSave}
                type="tel"
              />
              <EditableField
                label="Status"
                value={lead.status}
                field="status"
                onSave={handleFieldSave}
                type="select"
                options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                displayValue={
                  <Badge variant={statusConfig.variant as any} className="text-xs">
                    {lead.status || 'Unknown'}
                  </Badge>
                }
              />
              <EditableField
                label="Required By"
                value={lead.required_by_date}
                field="required_by_date"
                onSave={handleFieldSave}
                type="date"
                displayValue={
                  <span className="text-sm font-medium text-white">{formatDate(lead.required_by_date)}</span>
                }
              />
            </div>
          </SectionCard>

          {/* Finance Details */}
          <SectionCard title="Finance Details" icon={Building2} accentColor="text-emerald-400">
            <div className="space-y-0">
              <EditableField
                label="Finance Type"
                value={lead.finance_type}
                field="finance_type"
                onSave={handleFieldSave}
                type="select"
                options={FINANCE_TYPE_OPTIONS.map(t => ({ value: t, label: t }))}
                displayValue={
                  <Badge variant="outline" className="text-xs">{lead.finance_type || 'N/A'}</Badge>
                }
              />
              <EditableField
                label="Loan Amount"
                value={lead.loan_amount}
                field="loan_amount"
                onSave={handleFieldSave}
                type="number"
                displayValue={
                  <span className="text-sm font-medium text-white">
                    {lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount) : 'N/A')}
                  </span>
                }
              />
              <EditableField
                label="Assigned Agent"
                value={lead.assigned_agent}
                field="assigned_agent"
                onSave={handleFieldSave}
              />
              <EditableField
                label="Broker Company"
                value={lead.company_id}
                field="company_id"
                onSave={handleFieldSave}
                type="select"
                options={companyOptions}
                displayValue={
                  <span className="text-sm font-medium text-white">{getCompanyName(lead.company_id)}</span>
                }
              />
            </div>
          </SectionCard>
        </div>

        {/* ─── Column 2 ──────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Message */}
          <SectionCard title="Message" icon={MessageSquare} accentColor="text-cyan-400">
            <EditableTextarea
              value={lead.message}
              field="message"
              onSave={handleFieldSave}
              placeholder="No message provided."
            />
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes" icon={FileText} accentColor="text-violet-400">
            <EditableTextarea
              value={lead.notes}
              field="notes"
              onSave={handleFieldSave}
              placeholder="No notes added yet."
            />
          </SectionCard>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. TIMESTAMPS FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4">
          <div className="flex items-center gap-6 text-xs text-white/50">
            <span>Created: {formatDate(lead.created_at)}</span>
            {lead.updated_at && (
              <span>Last Updated: {formatDate(lead.updated_at)}</span>
            )}
            {lead.date_added && (
              <span>Date Added: {formatDate(lead.date_added)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
