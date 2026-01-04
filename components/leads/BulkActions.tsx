'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Edit, MessageSquare, Download, Archive, X } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  onAction: (action: string) => void
  onClear: () => void
}

const bulkActions = [
  { id: 'assign', label: 'Assign To', icon: UserPlus },
  { id: 'status', label: 'Change Status', icon: Edit },
  { id: 'message', label: 'Send Message', icon: MessageSquare },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'archive', label: 'Archive', icon: Archive },
]

export function BulkActions({ selectedCount, onAction, onClear }: BulkActionsProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
      <Badge variant="secondary" className="mr-2">
        {selectedCount} selected
      </Badge>

      {bulkActions.map((action) => (
        <Button
          key={action.id}
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onAction(action.id)}
        >
          <action.icon className="h-3.5 w-3.5 mr-1.5" />
          {action.label}
        </Button>
      ))}

      <Button variant="ghost" size="sm" className="ml-auto h-8" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
