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
  MessageCircle,
  User,
  Flame,
  Target,
  Edit,
  Save,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  PoundSterling,
  Percent,
  CreditCard,
  Briefcase,
  Building,
  FileText,
} from 'lucide-react'

export default function FinanceLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { financeLeads, isLoading } = useData()

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

    // TODO: Implement updateFinanceLead in DataContext
    setTimeout(() => {
      setSaveMessage({ type: 'success', text: 'Finance lead updated successfully!' })
      setIsEditing(false)
      setEditData({})
      setIsSaving(false)
    }, 500)
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

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 80) return 'text-orange-500'
    if (score >= 60) return 'text-success'
    return 'text-muted-foreground'
  }

  const getCreditColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 750) return 'text-success'
    if (score >= 650) return 'text-warning'
    return 'text-destructive'
  }

  const getLTVColor = (ltv: number | undefined) => {
    if (!ltv) return 'text-muted-foreground'
    if (ltv <= 60) return 'text-success'
    if (ltv <= 80) return 'text-warning'
    return 'text-destructive'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Application', 'Approved', 'Completed', 'Declined', 'Lost']
  const LOAN_TYPES = ['Purchase', 'Remortgage', 'Buy to Let', 'Bridging', 'Commercial', 'Development']
  const EMPLOYMENT_OPTIONS = ['Employed', 'Self-Employed', 'Director', 'Contractor', 'Retired', 'Unemployed']

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
              {(displayData.quality_score || 0) >= 80 && (
                <Flame className="h-5 w-5 text-orange-500" />
              )}
              {isEditing ? (
                <select
                  value={editData.status || displayData.status || 'New'}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              ) : (
                <Badge variant={displayData.status === 'Approved' ? 'success' : displayData.status === 'Declined' ? 'destructive' : 'outline'}>
                  {displayData.status || 'New'}
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

      {/* Key Finance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loan Amount</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={editData.loan_amount ?? displayData.loan_amount ?? 0}
                onChange={(e) => updateField('loan_amount', parseInt(e.target.value) || 0)}
                className="text-xl font-bold h-auto py-1"
              />
            ) : (
              <p className="text-2xl font-bold">
                {displayData.loan_amount ? formatCurrency(displayData.loan_amount) : 'N/A'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Property Value</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={editData.property_value ?? displayData.property_value ?? 0}
                onChange={(e) => updateField('property_value', parseInt(e.target.value) || 0)}
                className="text-xl font-bold h-auto py-1"
              />
            ) : (
              <p className="text-2xl font-bold">
                {displayData.property_value ? formatCurrency(displayData.property_value) : 'N/A'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">LTV</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                max="100"
                value={editData.ltv ?? displayData.ltv ?? 0}
                onChange={(e) => updateField('ltv', parseInt(e.target.value) || 0)}
                className="text-xl font-bold h-auto py-1"
              />
            ) : (
              <p className={`text-2xl font-bold ${getLTVColor(displayData.ltv)}`}>
                {displayData.ltv ? `${displayData.ltv}%` : 'N/A'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Credit Score</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                value={editData.credit_score ?? displayData.credit_score ?? 0}
                onChange={(e) => updateField('credit_score', parseInt(e.target.value) || 0)}
                className="text-xl font-bold h-auto py-1"
              />
            ) : (
              <p className={`text-2xl font-bold ${getCreditColor(displayData.credit_score)}`}>
                {displayData.credit_score || 'N/A'}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Quality Score</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                max="100"
                value={editData.quality_score ?? displayData.quality_score ?? 0}
                onChange={(e) => updateField('quality_score', parseInt(e.target.value) || 0)}
                className="text-xl font-bold h-auto py-1"
              />
            ) : (
              <p className={`text-2xl font-bold ${getScoreColor(displayData.quality_score)}`}>
                {displayData.quality_score || 0}
              </p>
            )}
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
              <span className="text-sm text-muted-foreground">Source</span>
              {isEditing ? (
                <Input
                  value={editData.source ?? displayData.source ?? ''}
                  onChange={(e) => updateField('source', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <Badge variant="outline">{displayData.source || 'N/A'}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Campaign</span>
              {isEditing ? (
                <Input
                  value={editData.campaign ?? displayData.campaign ?? ''}
                  onChange={(e) => updateField('campaign', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.campaign || 'N/A'}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Loan Type</span>
              {isEditing ? (
                <select
                  value={editData.loan_type ?? displayData.loan_type ?? ''}
                  onChange={(e) => updateField('loan_type', e.target.value)}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select...</option>
                  {LOAN_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              ) : (
                <Badge variant="secondary">{displayData.loan_type || 'N/A'}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Loan Amount</span>
              <span className="text-sm font-medium">
                {displayData.loan_amount ? formatCurrency(displayData.loan_amount) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Property Value</span>
              <span className="text-sm font-medium">
                {displayData.property_value ? formatCurrency(displayData.property_value) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">LTV Ratio</span>
              <span className={`text-sm font-medium ${getLTVColor(displayData.ltv)}`}>
                {displayData.ltv ? `${displayData.ltv}%` : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Employment & Income */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Employment & Income
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Employment Status</span>
              {isEditing ? (
                <select
                  value={editData.employment_status ?? displayData.employment_status ?? ''}
                  onChange={(e) => updateField('employment_status', e.target.value)}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select...</option>
                  {EMPLOYMENT_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              ) : (
                <Badge variant="outline">{displayData.employment_status || 'N/A'}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Annual Income</span>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.income ?? displayData.income ?? 0}
                  onChange={(e) => updateField('income', parseInt(e.target.value) || 0)}
                  className="max-w-[150px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">
                  {displayData.income ? formatCurrency(displayData.income) : 'N/A'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credit Score</span>
              <span className={`text-sm font-medium ${getCreditColor(displayData.credit_score)}`}>
                {displayData.credit_score || 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={editData.notes ?? displayData.notes ?? ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                placeholder="Add notes about this finance lead..."
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {displayData.notes || 'No notes added yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
