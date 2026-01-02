'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
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
} from 'lucide-react'

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<Buyer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchLead() {
      if (!params.id) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('buyers')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching lead:', error)
      } else {
        setLead(data)
      }
      setIsLoading(false)
    }

    fetchLead()
  }, [params.id])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-display">
                {lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown'}
              </h1>
              {(lead.quality_score || 0) >= 85 && (
                <Flame className="h-5 w-5 text-orange-500" />
              )}
              <Badge variant={lead.status === 'Qualified' ? 'success' : 'outline'}>
                {lead.status || 'New'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Added {formatDate(lead.created_at)} · Last contact {formatDate(lead.last_contact)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
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
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
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
            <p className={`text-3xl font-bold ${getScoreColor(lead.quality_score)}`}>
              {lead.quality_score || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Intent Score</span>
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(lead.intent_score)}`}>
              {lead.intent_score || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Budget</span>
            </div>
            <p className="text-xl font-bold">{lead.budget || 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Timeline</span>
            </div>
            <p className="text-xl font-bold">{lead.timeline || 'N/A'}</p>
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
              <span className="text-sm font-medium">{lead.email || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm font-medium">{lead.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              <Badge variant="outline">{lead.source || 'N/A'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Campaign</span>
              <span className="text-sm font-medium">{lead.campaign || 'N/A'}</span>
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
              <span className="text-sm font-medium">{lead.location || lead.area || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Bedrooms</span>
              <span className="text-sm font-medium">{lead.bedrooms || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Budget Range</span>
              <span className="text-sm font-medium">
                {lead.budget_min && lead.budget_max
                  ? `£${lead.budget_min.toLocaleString()} - £${lead.budget_max.toLocaleString()}`
                  : lead.budget || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="text-sm font-medium">{lead.payment_method || 'N/A'}</span>
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
              <Badge variant={lead.proof_of_funds ? 'success' : 'secondary'}>
                {lead.proof_of_funds ? 'Verified' : 'Pending'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">UK Broker</span>
              <Badge variant={lead.uk_broker ? 'success' : 'secondary'}>
                {lead.uk_broker ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">UK Solicitor</span>
              <Badge variant={lead.uk_solicitor ? 'success' : 'secondary'}>
                {lead.uk_solicitor ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mortgage Status</span>
              <span className="text-sm font-medium">{lead.mortgage_status || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {lead.notes || 'No notes added yet.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
