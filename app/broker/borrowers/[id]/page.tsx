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
import { ConversationThread } from '@/components/ConversationThread'
import { KycVerificationBanner } from '@/components/kyc/KycVerificationBanner'
import { useKycCheck } from '@/hooks/useKycCheck'
import {
  ArrowLeft, Phone, Mail, User, CheckCircle, AlertCircle, Calendar,
  MessageSquare, FileText, PoundSterling, Briefcase, Clock, UserCheck,
  Building2, XCircle, Save, Edit, X, Target, Shield, ShieldCheck,
  ExternalLink, DollarSign, Sparkles, MapPin,
} from 'lucide-react'

const STATUS_OPTIONS = [
  'Contact Pending', 'Follow-up', 'Awaiting Documents', 'Processing',
  'Approved', 'Not Proceeding', 'Duplicate', 'Completed',
]

const FINANCE_TYPE_OPTIONS = [
  'Bridging Finance', 'Development Finance', 'Residential',
  'Buy to let', 'Commercial', 'Other',
]

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  'Contact Pending': { bg: 'bg-amber-500', text: 'text-white' },
  'Follow-up': { bg: 'bg-blue-500', text: 'text-white' },
  'Awaiting Documents': { bg: 'bg-purple-500', text: 'text-white' },
  'Processing': { bg: 'bg-cyan-500', text: 'text-white' },
  'Approved': { bg: 'bg-emerald-600', text: 'text-white' },
  'Not Proceeding': { bg: 'bg-red-500', text: 'text-white' },
  'Duplicate': { bg: 'bg-gray-500', text: 'text-white' },
  'Completed': { bg: 'bg-emerald-600', text: 'text-white' },
}

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

function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-white text-right max-w-[60%] truncate">{value || '-'}</span>
    </div>
  )
}

// Keep existing EditableField component
function EditableField({
  label, value, field, onSave, icon: Icon, type = 'text',
}: {
  label: string; value: string | number | null | undefined; field: string;
  onSave: (field: string, value: string) => void; icon?: any;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date';
}) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value || ''))

  useEffect(() => { setTempValue(String(value || '')) }, [value])

  const handleSave = () => { onSave(field, tempValue); setEditing(false) }
  const handleCancel = () => { setTempValue(String(value || '')); setEditing(false) }

  const formatDisplayValue = () => {
    if (!value) return '-'
    if (type === 'date') {
      return new Date(String(value)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
          <Input type={type} value={tempValue} onChange={(e) => setTempValue(e.target.value)} className="h-8 w-44 text-sm" autoFocus />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave}>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCancel}>
            <XCircle className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white text-right max-w-[200px] truncate">{formatDisplayValue()}</span>
          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 transition-opacity" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Keep existing EditableSelectField
function EditableSelectField({
  label, value, field, options, onSave, icon: Icon,
}: {
  label: string; value: string | undefined | null; field: string;
  options: string[]; onSave: (field: string, value: string) => void; icon?: any;
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
        {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
    </div>
  )
}

// Keep existing NotesEditor
function NotesEditor({ notes, onSave, isSaving }: { notes: string | undefined | null; onSave: (notes: string) => void; isSaving: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [tempNotes, setTempNotes] = useState(notes || '')

  useEffect(() => { setTempNotes(notes || '') }, [notes])

  const handleSave = () => { onSave(tempNotes); setIsEditing(false) }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} placeholder="Add notes about this borrower..." rows={5} className="text-sm" />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />{isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100px] p-3 rounded-md bg-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsEditing(true)}>
      <p className="text-sm text-white/50 whitespace-pre-wrap">{notes || 'Click to add notes...'}</p>
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

  // Keep existing company init logic
  useEffect(() => {
    const initializeCompany = async () => {
      let currentUser = user
      if (!currentUser) {
        try {
          const stored = localStorage.getItem('naybourhood_user')
          if (stored) currentUser = JSON.parse(stored)
        } catch { /* ignore */ }
      }
      if (!currentUser?.id) { setIsReady(true); return }
      if (currentUser.company_id) { setCompanyId(currentUser.company_id); setIsReady(true); return }
      if (isSupabaseConfigured()) {
        const supabase = createClient()
        const { data: profile } = await supabase.from('user_profiles').select('company_id').eq('id', currentUser.id).single()
        if (profile?.company_id) setCompanyId(profile.company_id)
      }
      setIsReady(true)
    }
    initializeCompany()
  }, [user])

  const lead = useMemo(() => {
    const found = financeLeads.find((l) => l.id === params.id)
    if (found && companyId && found.company_id === companyId) return found
    return null
  }, [financeLeads, params.id, companyId])

  const handleFieldUpdate = async (field: string, value: string) => {
    if (!lead) return
    setIsSaving(true); setSaveMessage(null)
    try {
      const updateData: Partial<FinanceLead> = { [field]: value }
      if (field === 'loan_amount') updateData.loan_amount = parseFloat(value) || 0
      const result = await updateFinanceLead(lead.id, updateData)
      if (result) {
        setSaveMessage({ type: 'success', text: 'Updated successfully!' })
        setTimeout(() => setSaveMessage(null), 2000)
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update.' })
      }
    } catch { setSaveMessage({ type: 'error', text: 'An error occurred.' }) }
    finally { setIsSaving(false) }
  }

  const handleNotesUpdate = async (notes: string) => {
    if (!lead) return
    setIsSaving(true)
    try {
      await updateFinanceLead(lead.id, { notes })
      setSaveMessage({ type: 'success', text: 'Notes saved!' })
      setTimeout(() => setSaveMessage(null), 2000)
    } catch { setSaveMessage({ type: 'error', text: 'Failed to save notes.' }) }
    finally { setIsSaving(false) }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getDaysUntilRequired = () => {
    if (!lead?.required_by_date) return null
    const required = new Date(lead.required_by_date)
    const today = new Date()
    return Math.ceil((required.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const daysUntil = lead ? getDaysUntilRequired() : null
  const statusConfig = lead ? (STATUS_CONFIG[lead.status || ''] || { bg: 'bg-gray-500', text: 'text-white' }) : { bg: 'bg-gray-500', text: 'text-white' }

  // Loading state
  if (!isReady || isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="h-3 w-16 bg-white/10 rounded mb-2" />
              <div className="h-6 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Not found
  if (!lead) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="bg-[#111111] border border-white/10 rounded-xl py-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Borrower not found</h3>
          <p className="text-white/50 mb-4">Borrower not found or you don&apos;t have access.</p>
          <Button variant="link" onClick={() => router.push('/broker/borrowers')} className="text-white/50 hover:text-white">Return to Borrowers</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Button variant="ghost" onClick={() => router.push('/broker/borrowers')} className="text-white/40 hover:text-white mb-2 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Borrowers
          </Button>
          <h1 className="text-2xl font-bold text-white">
            {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/50 mt-1">
            {lead.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {lead.email}</span>}
            {lead.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {lead.phone}</span>}
            {lead.finance_type && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {lead.finance_type}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => lead.phone && window.open(`tel:${lead.phone}`)}>
            <Phone className="h-4 w-4 mr-2" /> Call
          </Button>
          <Button size="sm" variant="outline" onClick={() => lead.email && window.open(`mailto:${lead.email}`)}>
            <Mail className="h-4 w-4 mr-2" /> Email
          </Button>
        </div>
      </div>

      {/* Borrower Profile Hero */}
      <div className="bg-[#111111] border border-emerald-500/30 rounded-xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-emerald-400">
                {(lead.full_name || lead.first_name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h2 className="text-lg font-semibold text-white">
                  {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
                </h2>
                <Badge className={`${statusConfig.bg} ${statusConfig.text}`}>{lead.status || 'Unknown'}</Badge>
                {kycCheck && (
                  <Badge variant="outline" className={`text-xs ${
                    kycCheck.status === 'passed' ? 'border-emerald-500/30 text-emerald-400' :
                    kycCheck.status === 'pending' ? 'border-amber-500/30 text-amber-400' :
                    'border-red-500/30 text-red-400'
                  }`}>
                    <ShieldCheck className="w-3 h-3 mr-1" /> KYC: {kycCheck.status}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                {(lead.loan_amount || lead.loan_amount_display) && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <PoundSterling className="w-3.5 h-3.5" />
                    <span className="font-medium text-white">{lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount) : '')}</span>
                  </div>
                )}
                {lead.required_by_date && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Required by {formatDate(lead.required_by_date)}</span>
                  </div>
                )}
                {daysUntil !== null && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/50" />
                    <span className={`font-medium ${
                      daysUntil < 0 ? 'text-red-400' : daysUntil <= 7 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
                    </span>
                  </div>
                )}
                {lead.assigned_agent && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{lead.assigned_agent}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Verification Banner */}
      <KycVerificationBanner buyerId={lead.id} />

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          saveMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
        }`}>
          {saveMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      {/* Recommended Next Action */}
      <div className="bg-[#111111] border border-emerald-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Recommended Next Action</h4>
              <p className="text-sm text-white/60 mb-3">
                {lead.status === 'Contact Pending' ? 'Make initial contact with borrower. Confirm finance requirements and timeline.' :
                 lead.status === 'Awaiting Documents' ? 'Chase borrower for outstanding documentation. Check loan amount and required-by date.' :
                 lead.status === 'Processing' ? 'Monitor application progress. Keep borrower updated on status.' :
                 'Follow up with borrower to confirm interest and next steps.'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {lead.phone && (
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => window.open(`tel:${lead.phone}`)}>
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                )}
                {lead.email && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5" onClick={() => window.open(`mailto:${lead.email}`)}>
                    <Mail className="w-4 h-4 mr-1" /> Send Email
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verify This Borrower */}
      <div className="bg-[#111111] border border-amber-500/30 rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Verify This Borrower</h4>
              <p className="text-sm text-white/60 mb-3">Complete KYC, credit checks and identity verification via our integrated partner.</p>
              <div className="flex gap-2 flex-wrap">
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-medium">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Run KYC Check
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
                <a href="https://www.checkboard.com" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                    <DollarSign className="w-4 h-4 mr-1" /> Credit Check
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </a>
              </div>
              <p className="text-[10px] text-white/30 mt-2">Powered by Checkboard — KYC, AML & Credit verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Finance Type</p>
          <p className="text-sm font-bold text-white mt-1">{lead.finance_type || 'N/A'}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Loan Amount</p>
          <p className="text-lg font-bold text-white mt-1">{lead.loan_amount_display || (lead.loan_amount ? formatCurrency(lead.loan_amount) : 'N/A')}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Required By</p>
          <p className="text-sm font-bold text-white mt-1">{formatDate(lead.required_by_date)}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <p className="text-[10px] uppercase tracking-wider text-white/40">Days Left</p>
          <p className={`text-sm font-bold mt-1 ${
            daysUntil !== null && daysUntil < 0 ? 'text-red-400' :
            daysUntil !== null && daysUntil <= 7 ? 'text-amber-400' : 'text-emerald-400'
          }`}>{daysUntil !== null ? (daysUntil < 0 ? `${Math.abs(daysUntil)} overdue` : `${daysUntil} days`) : 'N/A'}</p>
        </div>
      </div>

      {/* WhatsApp Conversation Thread */}
      <ConversationThread
        buyerId={lead.id}
        buyerName={lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Lead'}
        buyerPhone={lead.phone}
        channel="whatsapp"
        maxHeight="400px"
        agentTranscript={(lead as any).agent_transcript}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Contact Information - Editable */}
          <SectionCard title="Contact Information" icon={User}>
            <EditableField label="Full Name" value={lead.full_name} field="full_name" onSave={handleFieldUpdate} icon={User} />
            <EditableField label="Email" value={lead.email} field="email" onSave={handleFieldUpdate} type="email" icon={Mail} />
            <EditableField label="Phone" value={lead.phone} field="phone" onSave={handleFieldUpdate} type="tel" icon={Phone} />
            <EditableSelectField label="Status" value={lead.status} field="status" options={STATUS_OPTIONS} onSave={handleFieldUpdate} />
          </SectionCard>

          {/* Finance Details - Editable */}
          <SectionCard title="Finance Details" icon={Building2} accentColor="text-cyan-400">
            <EditableSelectField label="Finance Type" value={lead.finance_type} field="finance_type" options={FINANCE_TYPE_OPTIONS} onSave={handleFieldUpdate} icon={Briefcase} />
            <EditableField label="Loan Amount" value={lead.loan_amount} field="loan_amount" onSave={handleFieldUpdate} type="number" icon={PoundSterling} />
            <EditableField label="Required By" value={lead.required_by_date} field="required_by_date" onSave={handleFieldUpdate} type="date" icon={Calendar} />
            <EditableField label="Assigned Agent" value={lead.assigned_agent} field="assigned_agent" onSave={handleFieldUpdate} icon={UserCheck} />
          </SectionCard>

          {/* Lead Message */}
          <SectionCard title="Lead Message" icon={MessageSquare}>
            <p className="text-sm text-white/50 whitespace-pre-wrap">{lead.message || 'No message provided.'}</p>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Status Update */}
          <SectionCard title="Update Status" icon={CheckCircle}>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  variant={lead.status === status ? 'default' : 'outline'}
                  size="sm"
                  className={`justify-start text-xs ${lead.status !== status ? 'border-white/10 text-white/60 hover:bg-white/5' : ''}`}
                  onClick={() => handleFieldUpdate('status', status)}
                >
                  {lead.status === status && <CheckCircle className="w-3 h-3 mr-1" />}
                  {status}
                </Button>
              ))}
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes" icon={FileText}>
            <NotesEditor notes={lead.notes} onSave={handleNotesUpdate} isSaving={isSaving} />
          </SectionCard>

          {/* Timeline */}
          <SectionCard title="Timeline" icon={Clock}>
            <div className="space-y-0">
              <DataRow label="Date Added" value={formatDate(lead.date_added || lead.created_at)} icon={Calendar} />
              {lead.updated_at && <DataRow label="Last Updated" value={formatDate(lead.updated_at)} icon={Clock} />}
              <DataRow label="Assigned To" value={lead.assigned_agent} icon={UserCheck} />
            </div>
          </SectionCard>

          {/* Quick Actions */}
          <SectionCard title="Quick Actions" icon={Sparkles} accentColor="text-emerald-400">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5" onClick={() => lead.phone && window.open(`tel:${lead.phone}`)}>
                <Phone className="h-4 w-4 mr-1" /> Call
              </Button>
              <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5" onClick={() => lead.email && window.open(`mailto:${lead.email}`)}>
                <Mail className="h-4 w-4 mr-1" /> Email
              </Button>
              <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5"
                onClick={() => handleFieldUpdate('status', 'Follow-up')} disabled={lead.status === 'Follow-up'}>
                <Clock className="h-4 w-4 mr-1" /> Follow-up
              </Button>
              <Button variant="outline" size="sm" className="border-white/10 text-white/60 hover:bg-white/5"
                onClick={() => handleFieldUpdate('status', 'Awaiting Documents')} disabled={lead.status === 'Awaiting Documents'}>
                <FileText className="h-4 w-4 mr-1" /> Request Docs
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
