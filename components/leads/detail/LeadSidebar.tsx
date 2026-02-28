'use client'

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
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base flex items-center gap-2 text-white">
            <BarChart3 className="w-4 h-4" />
            Status & Assignment
          </h3>
        </div>
        <div className="px-4 pb-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-white/50">Status</label>
            <select
              value={lead.status || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-[#111111] border-white/10 text-white text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-white/50">Assigned To</label>
            <select
              value={lead.assigned_to || ''}
              onChange={(e) => onAssigneeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-[#111111] border-white/10 text-white text-sm"
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
        </div>
      </div>

      {/* Notes & Comments */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base flex items-center gap-2 text-white">
            <MessageSquare className="w-4 h-4" />
            Notes & Comments
          </h3>
        </div>
        <div className="px-4 pb-4">
          <NotesComments
            notes={lead.notes}
            onSave={(notes) => onUpdateLead(lead.id, { notes })}
            userName="Admin"
          />
        </div>
      </div>

      {/* Timestamps */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base flex items-center gap-2 text-white">
            <Clock className="w-4 h-4" />
            Timeline
          </h3>
        </div>
        <div className="px-4 pb-4 space-y-0">
          <DataRow label="Date Added" value={formatDateTime(lead.date_added || lead.created_at)} icon={Calendar} />
          <DataRow label="Last Updated" value={formatDateTime(lead.updated_at)} />
          <DataRow label="Last Contact" value={formatDateTime(lead.last_contact)} icon={Phone} />
          <DataRow label="Last AI Score" value={formatDateTime(lead.ai_scored_at)} icon={Bot} />
        </div>
      </div>

      {/* AI Classification Details */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base flex items-center gap-2 text-white">
            <Bot className="w-4 h-4" />
            AI Classification Details
          </h3>
        </div>
        <div className="px-4 pb-4 space-y-0">
          <DataRow label="Classification" value={lead.ai_classification || classification} />
          <DataRow label="Priority" value={lead.ai_priority || priority} />
          <DataRow label="Quality Score" value={lead.ai_quality_score ?? lead.quality_score ?? 0} />
          <DataRow label="Intent Score" value={lead.ai_intent_score ?? lead.intent_score ?? 0} />
          <DataRow label="Confidence" value={lead.ai_confidence ? `${lead.ai_confidence}%` : '-'} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="p-4 pb-2">
          <h3 className="text-base text-white">Quick Actions</h3>
        </div>
        <div className="px-4 pb-4 space-y-2">
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
        </div>
      </div>

      {/* Lead ID */}
      <div className="bg-[#111111] border border-white/10 rounded-xl">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Lead ID:</span>
            <code className="bg-white/5 px-2 py-1 rounded">{lead.id}</code>
          </div>
        </div>
      </div>
    </div>
  )
}
