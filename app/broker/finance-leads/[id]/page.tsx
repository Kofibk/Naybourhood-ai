'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
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
} from 'lucide-react'

export default function BrokerFinanceLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { financeLeads, isLoading, updateFinanceLead } = useData()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editData, setEditData] = useState<Partial<FinanceLead>>({})

  const lead = useMemo(() => {
    const found = financeLeads.find((l) => l.id === params.id)
    // Only allow viewing if lead belongs to user's company
    if (found && user?.company_id && found.company_id === user.company_id) {
      return found
    }
    return null
  }, [financeLeads, params.id, user?.company_id])

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
        setSaveMessage({ type: 'success', text: 'Finance lead updated successfully!' })
        setIsEditing(false)
        setEditData({})
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update finance lead. Please try again.' })
      }
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'An error occurred while saving.' })
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof FinanceLead, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Loading state
  if (isLoading) {
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
            <p className="text-muted-foreground">Finance lead not found or you don&apos;t have access.</p>
            <Button variant="link" onClick={() => router.push('/broker/finance-leads')}>
              Return to Finance Leads
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayData = isEditing ? { ...lead, ...editData } : lead

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.push('/broker/finance-leads')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Finance Leads
      </Button>

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">
            {displayData.full_name || `${displayData.first_name || ''} ${displayData.last_name || ''}`.trim() || 'Unknown'}
          </h2>
          <p className="text-sm text-muted-foreground">Added {formatDate(displayData.date_added || displayData.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <select
              value={editData.status ?? displayData.status ?? ''}
              onChange={(e) => updateField('status', e.target.value)}
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="Contact Pending">Contact Pending</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Awaiting Documents">Awaiting Documents</option>
              <option value="Not Proceeding">Not Proceeding</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Completed">Completed</option>
            </select>
          ) : (
            <Badge variant={getStatusColor(displayData.status) as any} className="text-sm px-3 py-1">
              {displayData.status || 'Unknown'}
            </Badge>
          )}
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Lead Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
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
                <span className="text-sm font-medium">{displayData.full_name || '-'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              {isEditing ? (
                <Input
                  value={editData.email ?? displayData.email ?? ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <a href={`mailto:${displayData.email}`} className="text-sm font-medium text-primary hover:underline">
                  {displayData.email || '-'}
                </a>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              {isEditing ? (
                <Input
                  value={editData.phone ?? displayData.phone ?? ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <a href={`tel:${displayData.phone}`} className="text-sm font-medium text-primary hover:underline">
                  {displayData.phone || '-'}
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Finance Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
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
                  className="h-8 px-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select...</option>
                  <option value="Bridging Finance">Bridging Finance</option>
                  <option value="Development Finance">Development Finance</option>
                  <option value="Residential">Residential</option>
                  <option value="Buy to let">Buy to let</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <Badge variant="outline">{displayData.finance_type || '-'}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Loan Amount</span>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.loan_amount ?? displayData.loan_amount ?? ''}
                  onChange={(e) => updateField('loan_amount', Number(e.target.value))}
                  className="max-w-[150px] h-8"
                />
              ) : (
                <span className="text-sm font-bold flex items-center gap-1">
                  <PoundSterling className="h-3 w-3" />
                  {displayData.loan_amount_display || (displayData.loan_amount ? formatCurrency(displayData.loan_amount).replace('£', '') : '-')}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Required By</span>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.required_by_date ?? displayData.required_by_date ?? ''}
                  onChange={(e) => updateField('required_by_date', e.target.value)}
                  className="max-w-[150px] h-8"
                />
              ) : (
                <span className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(displayData.required_by_date)}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date Added</span>
              <span className="text-sm font-medium">{formatDate(displayData.date_added)}</span>
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
                className="w-full min-h-[120px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                placeholder="Lead's message or enquiry..."
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayData.message || 'No message provided.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
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
                placeholder="Add internal notes about this finance lead..."
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayData.notes || 'No notes added yet.'}
              </p>
            )}
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
            <Button variant="outline" onClick={() => displayData.phone && window.open(`tel:${displayData.phone}`)}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button variant="outline" onClick={() => displayData.email && window.open(`mailto:${displayData.email}`)}>
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
