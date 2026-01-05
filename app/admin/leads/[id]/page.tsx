'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import type { Buyer } from '@/types'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  MapPin,
  Banknote,
  Clock,
  User,
  Flame,
  Target,
  FileCheck,
  Building2,
  Edit,
  Save,
  X,
  Trash2,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Brain,
  TrendingUp,
  Home,
  CreditCard,
  Globe,
  Briefcase,
  FileText,
  Sparkles,
  AlertTriangle,
  Zap,
} from 'lucide-react'

const STATUS_OPTIONS = [
  'Contact Pending',
  'Follow Up',
  'Viewing Booked',
  'Negotiating',
  'Reserved',
  'Exchanged',
  'Completed',
  'Not Proceeding',
  'Duplicate',
]

const PAYMENT_OPTIONS = ['Cash', 'Mortgage']

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { leads, users, isLoading, updateLead, deleteLead, assignLead } = useData()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editData, setEditData] = useState<Partial<Buyer>>({})

  const lead = useMemo(() => {
    return leads.find((l) => l.id === params.id)
  }, [leads, params.id])

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
      const result = await updateLead(lead.id, editData)
      if (result) {
        setSaveMessage({ type: 'success', text: 'Lead updated successfully!' })
        setIsEditing(false)
        setEditData({})
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to update lead. Please try again.' })
      }
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'An error occurred while saving.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!lead || !confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return

    setIsDeleting(true)
    try {
      const success = await deleteLead(lead.id)
      if (success) {
        router.push('/admin/leads')
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to delete lead.' })
      }
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'An error occurred while deleting.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAssign = async (userId: string) => {
    if (!lead) return

    setIsAssigning(true)
    setSaveMessage(null)

    try {
      const success = await assignLead(lead.id, userId)
      if (success) {
        const assignedUser = users.find((u) => u.id === userId)
        setSaveMessage({
          type: 'success',
          text: `Lead assigned to ${assignedUser?.name || 'user'} successfully!`
        })
      } else {
        setSaveMessage({ type: 'error', text: 'Failed to assign lead. Please try again.' })
      }
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'An error occurred while assigning.' })
    } finally {
      setIsAssigning(false)
    }
  }

  const updateField = (field: keyof Buyer, value: any) => {
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
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Lead not found</h3>
            <p className="text-muted-foreground mb-4">The lead you are looking for does not exist or has been deleted.</p>
            <Button onClick={() => router.push('/admin/leads')}>Back to Leads</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const displayData = isEditing ? { ...lead, ...editData } : lead

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 70) return 'text-red-500'
    if (score >= 45) return 'text-orange-500'
    return 'text-muted-foreground'
  }

  const getScoreLabel = (score: number | undefined) => {
    if (!score) return 'Unscored'
    if (score >= 70) return 'Hot'
    if (score >= 45) return 'Warm'
    return 'Low'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatBudget = () => {
    // Check budget_range first (Supabase field name), then budget
    if (displayData.budget_range) return displayData.budget_range
    if (displayData.budget) return displayData.budget
    if (displayData.budget_min && displayData.budget_max) {
      return `£${displayData.budget_min.toLocaleString()} - £${displayData.budget_max.toLocaleString()}`
    }
    if (displayData.budget_min) return `£${displayData.budget_min.toLocaleString()}+`
    if (displayData.budget_max) return `Up to £${displayData.budget_max.toLocaleString()}`
    return '-'
  }

  // Get all raw data keys for debugging/display
  const allDataKeys = Object.keys(lead).filter(key => lead[key as keyof Buyer] !== null && lead[key as keyof Buyer] !== undefined && lead[key as keyof Buyer] !== '')

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              {isEditing ? (
                <Input
                  value={editData.full_name || displayData.full_name || ''}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="text-2xl font-bold h-auto py-1 max-w-[300px]"
                  placeholder="Full Name"
                />
              ) : (
                <h1 className="text-2xl font-bold font-display">
                  {displayData.full_name || `${displayData.first_name || ''} ${displayData.last_name || ''}`.trim() || 'Unknown'}
                </h1>
              )}
              {(displayData.quality_score || 0) >= 70 && (
                <Badge variant="destructive" className="gap-1">
                  <Flame className="h-3 w-3" />
                  Hot Lead
                </Badge>
              )}
              {(displayData.quality_score || 0) >= 45 && (displayData.quality_score || 0) < 70 && (
                <Badge variant="warning" className="bg-orange-500 gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Warm
                </Badge>
              )}
              {isEditing ? (
                <select
                  value={editData.status || displayData.status || ''}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select Status...</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              ) : (
                <Badge variant={displayData.status === 'Completed' || displayData.status === 'Reserved' ? 'success' : 'outline'}>
                  {displayData.status || 'New'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Added {formatDate(displayData.created_at)}
              {displayData.last_contact && ` · Last contact ${formatDate(displayData.last_contact)}`}
              {displayData.source && ` · Source: ${displayData.source}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
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
              {displayData.phone && (
                <Button size="sm" asChild>
                  <a href={`tel:${displayData.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                </Button>
              )}
              {displayData.email && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`mailto:${displayData.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
              {displayData.phone && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`https://wa.me/${displayData.phone.replace(/[^0-9]/g, '')}`} target="_blank">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${getScoreColor(displayData.quality_score)}`}>
                  {displayData.quality_score || 0}
                </p>
                <Badge variant="outline" className={`text-xs ${getScoreColor(displayData.quality_score)}`}>
                  {getScoreLabel(displayData.quality_score)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Intent Score</span>
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                max="100"
                value={editData.intent_score ?? displayData.intent_score ?? 0}
                onChange={(e) => updateField('intent_score', parseInt(e.target.value) || 0)}
                className="text-xl font-bold h-auto py-1"
              />
            ) : (
              <p className={`text-3xl font-bold ${getScoreColor(displayData.intent_score)}`}>
                {displayData.intent_score || 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">AI Confidence</span>
            </div>
            <p className="text-3xl font-bold text-primary">
              {displayData.ai_confidence ? `${Math.round(displayData.ai_confidence * 100)}%` : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Budget</span>
            </div>
            {isEditing ? (
              <Input
                value={editData.budget ?? displayData.budget ?? ''}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="e.g., £500K - £750K"
                className="text-lg font-bold h-auto py-1"
              />
            ) : (
              <p className="text-xl font-bold">{formatBudget()}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Payment</span>
            </div>
            {isEditing ? (
              <select
                value={editData.payment_method ?? displayData.payment_method ?? ''}
                onChange={(e) => updateField('payment_method', e.target.value)}
                className="w-full px-2 py-1 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select...</option>
                {PAYMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <Badge variant={displayData.payment_method === 'Cash' ? 'success' : 'secondary'} className="text-sm">
                {displayData.payment_method || '-'}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Summary (if available) */}
      {displayData.ai_summary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{displayData.ai_summary}</p>
            {displayData.ai_next_action && (
              <div className="mt-3 p-3 bg-background rounded-lg border">
                <p className="text-xs text-muted-foreground mb-1">Recommended Next Action</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  {displayData.ai_next_action}
                </p>
              </div>
            )}
            {displayData.ai_risk_flags && displayData.ai_risk_flags.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Risk Flags</p>
                <div className="flex flex-wrap gap-2">
                  {displayData.ai_risk_flags.map((flag, i) => (
                    <Badge key={i} variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <span className="text-sm font-medium">
                {displayData.full_name || `${displayData.first_name || ''} ${displayData.last_name || ''}`.trim() || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              {isEditing ? (
                <Input
                  type="email"
                  value={editData.email ?? displayData.email ?? ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="max-w-[220px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.email || '-'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              {isEditing ? (
                <Input
                  type="tel"
                  value={editData.phone ?? displayData.phone ?? ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="max-w-[220px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.phone || '-'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Location</span>
              {isEditing ? (
                <Input
                  value={editData.location ?? displayData.location ?? displayData.area ?? ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="max-w-[220px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.location || displayData.area || '-'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Country</span>
              {isEditing ? (
                <Input
                  value={editData.country ?? displayData.country ?? ''}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="max-w-[220px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.country || '-'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Timeline</span>
              {isEditing ? (
                <Input
                  value={editData.timeline ?? displayData.timeline ?? ''}
                  onChange={(e) => updateField('timeline', e.target.value)}
                  className="max-w-[220px] h-8"
                  placeholder="e.g., 3-6 months"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.timeline || '-'}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Property Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bedrooms</span>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.preferred_bedrooms ?? editData.bedrooms ?? displayData.preferred_bedrooms ?? displayData.bedrooms ?? ''}
                  onChange={(e) => updateField('preferred_bedrooms', parseInt(e.target.value) || undefined)}
                  className="max-w-[100px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.preferred_bedrooms || displayData.bedrooms || '-'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Budget Range</span>
              <span className="text-sm font-medium">{formatBudget()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <Badge variant={displayData.payment_method === 'Cash' ? 'success' : 'secondary'}>
                {displayData.payment_method || '-'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mortgage Status</span>
              {isEditing ? (
                <Input
                  value={editData.mortgage_status ?? displayData.mortgage_status ?? ''}
                  onChange={(e) => updateField('mortgage_status', e.target.value)}
                  className="max-w-[220px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.mortgage_status || '-'}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Source & Campaign */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Source & Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              {isEditing ? (
                <Input
                  value={editData.source ?? displayData.source ?? ''}
                  onChange={(e) => updateField('source', e.target.value)}
                  className="max-w-[220px] h-8"
                />
              ) : (
                <Badge variant="outline">{displayData.source || '-'}</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Campaign</span>
              {isEditing ? (
                <Input
                  value={editData.campaign ?? displayData.campaign ?? ''}
                  onChange={(e) => updateField('campaign', e.target.value)}
                  className="max-w-[220px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.campaign || '-'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Date Added</span>
              <span className="text-sm">{formatDate(displayData.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm">{formatDate(displayData.updated_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Contact</span>
              <span className="text-sm">{formatDate(displayData.last_contact)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Qualification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Qualification Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Proof of Funds</span>
              {isEditing ? (
                <select
                  value={editData.proof_of_funds ?? displayData.proof_of_funds ? 'true' : 'false'}
                  onChange={(e) => updateField('proof_of_funds', e.target.value === 'true')}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  <option value="false">Pending</option>
                  <option value="true">Verified</option>
                </select>
              ) : (
                <Badge variant={displayData.proof_of_funds ? 'success' : 'secondary'}>
                  {displayData.proof_of_funds ? '✓ Verified' : 'Pending'}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">UK Broker</span>
              {isEditing ? (
                <select
                  value={editData.uk_broker ?? displayData.uk_broker ? 'true' : 'false'}
                  onChange={(e) => updateField('uk_broker', e.target.value === 'true')}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : (
                <Badge variant={displayData.uk_broker ? 'success' : 'secondary'}>
                  {displayData.uk_broker ? '✓ Yes' : 'No'}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">UK Solicitor</span>
              {isEditing ? (
                <select
                  value={editData.uk_solicitor ?? displayData.uk_solicitor ? 'true' : 'false'}
                  onChange={(e) => updateField('uk_solicitor', e.target.value === 'true')}
                  className="px-2 py-1 rounded-md border border-input bg-background text-sm"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : (
                <Badge variant={displayData.uk_solicitor ? 'success' : 'secondary'}>
                  {displayData.uk_solicitor ? '✓ Yes' : 'No'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Lead Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Assigned To</span>
              <div className="flex items-center gap-2">
                {displayData.assigned_user_name ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{displayData.assigned_user_name}</span>
                  </div>
                ) : (
                  <Badge variant="secondary">Unassigned</Badge>
                )}
              </div>
            </div>
            {displayData.assigned_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned On</span>
                <span className="text-sm">{formatDate(displayData.assigned_at)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border">
              <label className="text-sm font-medium block mb-2">
                {displayData.assigned_to ? 'Reassign Lead' : 'Assign Lead'}
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                  value={displayData.assigned_to || ''}
                  onChange={(e) => e.target.value && handleAssign(e.target.value)}
                  disabled={isAssigning}
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
                {isAssigning && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    Assigning...
                  </div>
                )}
              </div>
            </div>
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
                className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-y"
                placeholder="Add notes about this lead..."
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayData.notes || 'No notes added yet.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Raw Data (for debugging - shows any fields we might have missed) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Data Fields ({allDataKeys.length} fields with values)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allDataKeys.map((key) => (
              <div key={key} className="text-sm">
                <span className="text-muted-foreground">{key}:</span>{' '}
                <span className="font-medium">
                  {typeof lead[key as keyof Buyer] === 'boolean'
                    ? lead[key as keyof Buyer] ? 'Yes' : 'No'
                    : typeof lead[key as keyof Buyer] === 'object'
                    ? JSON.stringify(lead[key as keyof Buyer])
                    : String(lead[key as keyof Buyer])}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
