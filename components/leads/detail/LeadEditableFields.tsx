'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, XCircle, Edit, MessageSquare } from 'lucide-react'
import { CONNECTION_STATUS_OPTIONS } from '@/lib/leadUtils'

// Editable Text Field Component
export function EditableTextField({
  label,
  value,
  field,
  onSave,
  icon: Icon,
  type = 'text'
}: {
  label: string
  value: string | number | null | undefined
  field: string
  onSave: (field: string, value: string) => void
  icon?: any
  type?: 'text' | 'email' | 'tel' | 'number'
}) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value || ''))

  const handleSave = () => {
    onSave(field, tempValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(String(value || ''))
    setEditing(false)
  }

  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 group gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1 justify-end">
          <input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="text-sm bg-background border border-input rounded-md px-2 py-1 w-full max-w-[200px]"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave}><CheckCircle className="h-4 w-4 text-green-600" /></Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}><XCircle className="h-4 w-4 text-red-400" /></Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="text-sm font-medium text-right break-words">{value || '-'}</span>
          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Editable Boolean Field Component
export function EditableBooleanField({
  label,
  value,
  field,
  onSave,
}: {
  label: string
  value: boolean | undefined | null
  field: string
  onSave: (field: string, value: boolean) => void
}) {
  const isTrue = Boolean(value)

  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">{label}</span>
      <button
        onClick={() => onSave(field, !isTrue)}
        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors flex-shrink-0 ${
          isTrue
            ? 'text-green-600 hover:bg-green-50'
            : 'text-red-400 hover:bg-red-50'
        }`}
      >
        {isTrue ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {isTrue ? 'Yes' : 'No'}
      </button>
    </div>
  )
}

// Editable Select Field Component
export function EditableSelectField({
  label,
  value,
  field,
  options,
  onSave,
  icon: Icon,
}: {
  label: string
  value: string | undefined | null
  field: string
  options: { value: string; label: string }[]
  onSave: (field: string, value: string) => void
  icon?: any
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <select
        value={value || ''}
        onChange={(e) => onSave(field, e.target.value)}
        className="text-sm bg-background border border-input rounded-md px-2 py-1 min-w-0 max-w-[220px]"
      >
        <option value="">-</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// Connection Status Display Component
export function ConnectionStatusDisplay({ value }: { value: string | boolean | undefined | null }) {
  // Handle legacy boolean values
  let normalizedValue = value
  if (typeof normalizedValue === 'boolean') {
    normalizedValue = normalizedValue ? 'yes' : 'unknown'
  }

  const status = CONNECTION_STATUS_OPTIONS.find(s => s.value === normalizedValue) || CONNECTION_STATUS_OPTIONS[3]
  const Icon = status.icon

  return (
    <span className={`flex items-center gap-1 ${status.color}`}>
      {Icon ? <Icon className="h-4 w-4" /> : <span className="h-4 w-4 inline-flex items-center justify-center">—</span>}
      <span className="text-xs">{status.label}</span>
    </span>
  )
}

// Editable Connection Status Component
export function EditableConnectionStatus({
  value,
  onChange,
  label
}: {
  value: string | boolean | undefined | null
  onChange: (newValue: string) => void
  label: string
}) {
  // Handle legacy boolean values
  const currentValue = typeof value === 'boolean' ? (value ? 'yes' : 'unknown') : (value || 'unknown')

  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0 gap-4">
      <span className="text-sm text-muted-foreground flex-shrink-0 whitespace-nowrap">{label}</span>
      <select
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-background border border-input rounded-md px-2 py-1 min-w-0 max-w-[220px]"
      >
        {CONNECTION_STATUS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.value === 'yes' || option.value === 'introduced' ? '✓ ' : option.value === 'no' ? '✗ ' : '— '}
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// Comment type for notes
interface Comment {
  id: string
  text: string
  author: string
  timestamp: string
}

// Notes/Comments Component
export function NotesComments({
  notes,
  onSave,
  userName = 'Admin'
}: {
  notes: string | null | undefined
  onSave: (notes: string) => void
  userName?: string
}) {
  const [newComment, setNewComment] = useState('')

  // Parse existing notes as comments (JSON array) or convert legacy text
  const parseComments = (): Comment[] => {
    if (!notes) return []
    try {
      const parsed = JSON.parse(notes)
      if (Array.isArray(parsed)) return parsed
      // Legacy text format - convert to single comment
      return [{ id: '1', text: notes, author: 'System', timestamp: new Date().toISOString() }]
    } catch {
      // Legacy text format
      if (notes.trim()) {
        return [{ id: '1', text: notes, author: 'Imported', timestamp: new Date().toISOString() }]
      }
      return []
    }
  }

  const comments = parseComments()

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      text: newComment.trim(),
      author: userName,
      timestamp: new Date().toISOString()
    }

    const updatedComments = [...comments, newCommentObj]
    onSave(JSON.stringify(updatedComments))
    setNewComment('')
  }

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-3">
      {/* Existing Comments */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-primary">{comment.author}</span>
                <span className="text-xs text-muted-foreground">{formatTimestamp(comment.timestamp)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Add New Comment */}
      <div className="border-t pt-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="text-sm mb-2"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
            <MessageSquare className="w-4 h-4 mr-1" /> Add Comment
          </Button>
        </div>
      </div>
    </div>
  )
}
