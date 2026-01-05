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
  Users,
} from 'lucide-react'

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
        <p className="text-muted-foreground">Lead not found</p>
      </div>
    )
  }

  const displayData = isEditing ? { ...lead, ...editData } : lead

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 85) return 'text-orange-500'
    if (score >= 70) return 'text-success'
    if (score >= 50) return 'text-warning'
    return 'text-muted-foreground'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

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
              {(displayData.quality_score || 0) >= 85 && (
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
                <Badge variant={displayData.status === 'Qualified' ? 'success' : 'outline'}>
                  {displayData.status || 'New'}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Added {formatDate(displayData.created_at)} · Last contact {formatDate(displayData.last_contact)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
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
              <Button size="sm" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                className="text-2xl font-bold h-auto py-1"
              />
            ) : (
              <p className={`text-3xl font-bold ${getScoreColor(displayData.quality_score)}`}>
                {displayData.quality_score || 0}
              </p>
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
                className="text-2xl font-bold h-auto py-1"
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
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Budget</span>
            </div>
            {isEditing ? (
              <Input
                value={editData.budget ?? displayData.budget ?? ''}
                onChange={(e) => updateField('budget', e.target.value)}
                placeholder="e.g., £500,000 - £750,000"
                className="text-lg font-bold h-auto py-1"
              />
            ) : (
              <p className="text-xl font-bold">{displayData.budget || 'N/A'}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Timeline</span>
            </div>
            {isEditing ? (
              <Input
                value={editData.timeline ?? displayData.timeline ?? ''}
                onChange={(e) => updateField('timeline', e.target.value)}
                placeholder="e.g., 3-6 months"
                className="text-lg font-bold h-auto py-1"
              />
            ) : (
              <p className="text-xl font-bold">{displayData.timeline || 'N/A'}</p>
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
              <span className="text-sm text-muted-foreground">Location</span>
              {isEditing ? (
                <Input
                  value={editData.location ?? displayData.location ?? displayData.area ?? ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.location || displayData.area || 'N/A'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bedrooms</span>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.bedrooms ?? displayData.bedrooms ?? ''}
                  onChange={(e) => updateField('bedrooms', parseInt(e.target.value) || undefined)}
                  className="max-w-[100px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.bedrooms || 'N/A'}</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Budget Range</span>
              <span className="text-sm font-medium">
                {displayData.budget_min && displayData.budget_max
                  ? `£${displayData.budget_min.toLocaleString()} - £${displayData.budget_max.toLocaleString()}`
                  : displayData.budget || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              {isEditing ? (
                <Input
                  value={editData.payment_method ?? displayData.payment_method ?? ''}
                  onChange={(e) => updateField('payment_method', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.payment_method || 'N/A'}</span>
              )}
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
                  {displayData.proof_of_funds ? 'Verified' : 'Pending'}
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
                  {displayData.uk_broker ? 'Yes' : 'No'}
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
                  {displayData.uk_solicitor ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mortgage Status</span>
              {isEditing ? (
                <Input
                  value={editData.mortgage_status ?? displayData.mortgage_status ?? ''}
                  onChange={(e) => updateField('mortgage_status', e.target.value)}
                  className="max-w-[200px] h-8"
                />
              ) : (
                <span className="text-sm font-medium">{displayData.mortgage_status || 'N/A'}</span>
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
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={editData.notes ?? displayData.notes ?? ''}
                onChange={(e) => updateField('notes', e.target.value)}
                className="w-full min-h-[100px] p-2 rounded-md border border-input bg-background text-sm resize-y"
                placeholder="Add notes about this lead..."
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
