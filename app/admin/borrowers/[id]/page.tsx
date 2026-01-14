'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
} from 'lucide-react'

export default function FinanceLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { financeLeads, companies, isLoading, updateFinanceLead } = useData()

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

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editData, setEditData] = useState<Partial<FinanceLead>>({})

  const lead = useMemo(() => {
    return financeLeads.find((l) => l.id === params.id)
  }, [financeLeads, params.id])

  const handleEdit = () => {
    if (lead) {
      setEditData({ ...lead })
      setIsEditing(true)
      setSaveMessage(null)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
    setSaveMessage(null)
  }

  const handleSave = async () => {
    if (!lead) return
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const result = await updateFinanceLead(lead.id, editData)
      if (result) {
        setSaveMessage({ type: 'success', text: 'Borrower updated successfully!' })
        setIsEditing(false)
        setEditData({})
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update borrower. Please try again.' })
      }
    } catch (error) {
      console.error('Error updating borrower:', error)
      setSaveMessage({ type: 'error', text: 'An error occurred while saving.' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof FinanceLead, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

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
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="text-muted-foreground">Finance lead not found</p>
      </div>
    )
  }

  const displayData = isEditing ? { ...lead, ...editData } : lead

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Contact Pending': return 'warning'
      case 'Follow-up': return 'default'
      case 'Awaiting Documents': return 'secondary'
      case 'Not Proceeding': return 'destructive'
      case 'Duplicate': return 'muted'
      case 'Completed': return 'success'
      default: return 'outline'
    }
  }

  const STATUS_OPTIONS = ['Contact Pending', 'Follow-up', 'Awaiting Documents', 'Not Proceeding', 'Duplicate', 'Completed']
  const FINANCE_TYPE_OPTIONS = ['Bridging Finance', 'Development Finance', 'Residential', 'Buy to let', 'Other']

  // Calculate days until required
  const getDaysUntilRequired = () => {
    if (!displayData.required_by_date) return null
    const required = new Date(displayData.required_by_date)
    const today = new Date()
    const diff = Math.ceil((required.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntil = getDaysUntilRequired()

  return (
    <div className="space-y-6">
      {/* Save Message */}
      {saveMessage && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          saveMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{saveMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Input
                  value={editData.full_name || displayData.full_name || ''}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="text-2xl font-bold h-auto py-1"
                  placeholder="Full Name"
                />
              ) : (
                <h1 className="text-2xl font-bold font-display">
                  {displayData.full_name || `${displayData.first_name || ''} ${displayData.last_name || ''}`.trim() || 'Unknown'}
                </h1>
              )}
              {isEditing ? (
                <select
                  value={editData.status || displayData.status || 'Contact Pending'}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              ) : (
                <Badge variant={getStatusColor(displayData.status) as any}>
                  {displayData.status || 'Unknown'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Added {formatDate(displayData.created_at)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button size="sm" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </>
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
              {displayData.finance_type || 'N/A'}
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
              {displayData.loan_amount_display || (displayData.loan_amount ? formatCurrency(displayData.loan_amount) : 'N/A')}
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
              {formatDate(displayData.required_by_date)}
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
            <p className="text-sm font-medium truncate" title={displayData.assigned_agent}>
              {displayData.assigned_agent || 'Unassigned'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Date Added</span>
            </div>
            <p className="text-sm font-medium">
              {formatDate(displayData.date_added)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Full Name</span>
              {isEditing ? (
                <Input
                  value={editData.full_name ?? displayData.full_name ?? ''}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">
                  {displayData.full_name || `${displayData.first_name || ''} ${displayData.last_name || ''}`.trim() || 'N/A'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              {isEditing ? (
                <Input
                  type="email"
                  value={editData.email ?? displayData.email ?? ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.email || 'N/A'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editData.phone ?? displayData.phone ?? ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.phone || 'N/A'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {isEditing ? (
                <select
                  value={editData.status ?? displayData.status ?? ''}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              ) : (
                <Badge variant={getStatusColor(displayData.status) as any}>
                  {displayData.status || 'Unknown'}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Required By</span>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.required_by_date ?? displayData.required_by_date ?? ''}
                  onChange={(e) => updateField('required_by_date', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{formatDate(displayData.required_by_date)}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Finance Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Finance Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Finance Type</span>
              {isEditing ? (
                <select
                  value={editData.finance_type ?? displayData.finance_type ?? ''}
                  onChange={(e) => updateField('finance_type', e.target.value)}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select...</option>
                  {FINANCE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline">{displayData.finance_type || 'N/A'}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Loan Amount</span>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.loan_amount ?? displayData.loan_amount ?? ''}
                  onChange={(e) => updateField('loan_amount', parseFloat(e.target.value) || 0)}
                  className="max-w-[150px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">
                  {displayData.loan_amount_display || (displayData.loan_amount ? formatCurrency(displayData.loan_amount) : 'N/A')}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date Added</span>
              <span className="text-sm font-medium">{formatDate(displayData.date_added)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assigned Agent</span>
              {isEditing ? (
                <Input
                  value={editData.assigned_agent ?? displayData.assigned_agent ?? ''}
                  onChange={(e) => updateField('assigned_agent', e.target.value)}
                  className="max-w-[150px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.assigned_agent || 'Unassigned'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Broker Company</span>
              {isEditing ? (
                <select
                  value={editData.company_id ?? displayData.company_id ?? ''}
                  onChange={(e) => updateField('company_id', e.target.value || undefined)}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Unassigned</option>
                  {brokerCompanies.length > 0 ? (
                    brokerCompanies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))
                  ) : (
                    companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))
                  )}
                </select>
              ) : (
                <span className="text-sm font-medium">{getCompanyName(displayData.company_id)}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={editData.message ?? displayData.message ?? ''}
                onChange={(e) => updateField('message', e.target.value)}
                className="w-full min-h-[150px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                placeholder="Lead's message or inquiry..."
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayData.message || 'No message provided.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={editData.notes ?? displayData.notes ?? ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full min-h-[120px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                placeholder="Add internal notes about this borrower..."
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayData.notes || 'No notes added yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timestamps */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>Created: {formatDate(displayData.created_at)}</span>
            {displayData.updated_at && (
              <span>Last Updated: {formatDate(displayData.updated_at)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
