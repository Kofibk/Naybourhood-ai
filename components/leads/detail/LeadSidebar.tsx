'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Buyer } from '@/types'
import { STATUS_OPTIONS, formatDateTime } from '@/lib/leadUtils'
import { DataRow } from '@/components/leads/detail/LeadDisplayComponents'
import { NotesComments } from '@/components/leads/detail/LeadEditableFields'
import {
  Phone,
  Calendar,
  Bot,
  MessageSquare,
  BarChart3,
  Building,
  CheckCircle,
  Clock,
} from 'lucide-react'

interface LeadSidebarProps {
  lead: Buyer
  users: Array<{ id: string; name: string }>
  classification: string
  priority: string
  onStatusChange: (status: string) => void
  onAssigneeChange: (assignee: string) => void
  onUpdateLead: (id: string, data: Record<string, any>) => void
}

export function LeadSidebar({
  lead,
  users,
  classification,
  priority,
  onStatusChange,
  onAssigneeChange,
  onUpdateLead,
}: LeadSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Status & Assignment */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Status & Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Status</label>
            <select
              value={lead.status || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Assigned To</label>
            <select
              value={lead.assigned_to || ''}
              onChange={(e) => onAssigneeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {lead.assigned_user_name && (
            <DataRow label="Assigned User" value={lead.assigned_user_name} />
          )}
          {lead.assigned_at && (
            <DataRow label="Assigned At" value={formatDateTime(lead.assigned_at)} />
          )}
        </CardContent>
      </Card>

      {/* Notes & Comments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes & Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotesComments
            notes={lead.notes}
            onSave={(notes) => onUpdateLead(lead.id, { notes })}
            userName="Admin"
          />
        </CardContent>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <DataRow label="Date Added" value={formatDateTime(lead.date_added || lead.created_at)} icon={Calendar} />
          <DataRow label="Last Updated" value={formatDateTime(lead.updated_at)} />
          <DataRow label="Last Contact" value={formatDateTime(lead.last_contact)} icon={Phone} />
          <DataRow label="Last AI Score" value={formatDateTime(lead.ai_scored_at)} icon={Bot} />
        </CardContent>
      </Card>

      {/* AI Classification Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Classification Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <DataRow label="Classification" value={lead.ai_classification || classification} />
          <DataRow label="Priority" value={lead.ai_priority || priority} />
          <DataRow label="Quality Score" value={lead.ai_quality_score ?? lead.quality_score ?? 0} />
          <DataRow label="Intent Score" value={lead.ai_intent_score ?? lead.intent_score ?? 0} />
          <DataRow label="Confidence" value={lead.ai_confidence ? `${lead.ai_confidence}%` : '-'} />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lead.status !== 'Viewing Booked' && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onStatusChange('Viewing Booked')}
            >
              <Calendar className="w-4 h-4 mr-2" /> Book Viewing
            </Button>
          )}
          {(!lead.uk_broker || lead.uk_broker === 'no' || lead.uk_broker === 'unknown') && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onUpdateLead(lead.id, { uk_broker: 'introduced' })}
            >
              <Building className="w-4 h-4 mr-2" /> Refer to Broker
            </Button>
          )}
          {!lead.proof_of_funds && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onUpdateLead(lead.id, { proof_of_funds: true })}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Mark Funds Verified
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lead ID */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Lead ID:</span>
            <code className="bg-muted px-2 py-1 rounded">{lead.id}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
