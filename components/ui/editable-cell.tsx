'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, X, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditableCellProps {
  value: string | number | undefined | null
  field: string
  rowId: string
  type?: 'text' | 'number' | 'select' | 'badge'
  options?: string[] | { value: string; label: string; variant?: string }[]
  onSave: (rowId: string, field: string, value: string | number) => Promise<boolean>
  className?: string
  displayValue?: string
  badgeVariant?: string
  editable?: boolean
}

export function EditableCell({
  value,
  field,
  rowId,
  type = 'text',
  options,
  onSave,
  className,
  displayValue,
  badgeVariant,
  editable = true,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (isEditing) {
      if (type === 'select') {
        selectRef.current?.focus()
      } else {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
  }, [isEditing, type])

  useEffect(() => {
    setEditValue(value?.toString() || '')
  }, [value])

  const handleDoubleClick = () => {
    if (editable) {
      setIsEditing(true)
      setEditValue(value?.toString() || '')
    }
  }

  const handleSave = async () => {
    if (editValue === (value?.toString() || '')) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      const newValue = type === 'number' ? Number(editValue) : editValue
      const success = await onSave(rowId, field, newValue)
      if (success) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value?.toString() || '')
    setIsEditing(false)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Tab') {
      handleSave()
    }
  }

  const handleBlur = () => {
    // Small delay to allow button clicks to register
    setTimeout(() => {
      if (isEditing && !isSaving) {
        handleSave()
      }
    }, 150)
  }

  if (isEditing) {
    if (type === 'select' && options) {
      return (
        <div className="flex items-center gap-1">
          <select
            ref={selectRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isSaving}
            className="h-8 px-2.5 text-xs font-medium border rounded-md bg-background w-full min-w-[140px]"
          >
            {options.map((opt) => {
              const optValue = typeof opt === 'string' ? opt : opt.value
              const optLabel = typeof opt === 'string' ? opt : opt.label
              return (
                <option key={optValue} value={optValue}>
                  {optLabel}
                </option>
              )
            })}
          </select>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={isSaving}
          className="h-7 px-2 text-xs min-w-[80px]"
        />
      </div>
    )
  }

  // Display mode
  const display = displayValue || value?.toString() || '-'

  if (type === 'badge') {
    return (
      <div
        className={cn('group cursor-pointer', className)}
        onDoubleClick={handleDoubleClick}
        title={editable ? 'Double-click to edit' : undefined}
      >
        <Badge
          variant={(badgeVariant as any) || 'secondary'}
          className={cn(
            'text-[10px]',
            editable && 'group-hover:ring-2 group-hover:ring-primary/50'
          )}
        >
          {display}
          {editable && (
            <Pencil className="h-2.5 w-2.5 ml-1 opacity-0 group-hover:opacity-50" />
          )}
        </Badge>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group cursor-pointer min-h-[24px] flex items-center',
        editable && 'hover:bg-muted/50 rounded px-1 -mx-1',
        className
      )}
      onDoubleClick={handleDoubleClick}
      title={editable ? 'Double-click to edit' : undefined}
    >
      <span className={cn('whitespace-nowrap', !value && 'text-muted-foreground')}>
        {display}
      </span>
      {editable && (
        <Pencil className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-30 shrink-0" />
      )}
    </div>
  )
}

// Specialized editable components
export function EditableScore({
  value,
  field,
  rowId,
  onSave,
  className,
}: Omit<EditableCellProps, 'type'>) {
  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 80) return 'text-red-500'
    if (score >= 60) return 'text-orange-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <EditableCell
      value={value}
      field={field}
      rowId={rowId}
      type="number"
      onSave={onSave}
      className={cn(getScoreColor(Number(value)), 'font-medium', className)}
    />
  )
}

export function EditableStatus({
  value,
  field,
  rowId,
  onSave,
  options,
  className,
}: Omit<EditableCellProps, 'type'>) {
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'New':
      case 'Contact Pending':
        return 'warning'
      case 'Contacted':
      case 'Follow Up':
        return 'secondary'
      case 'Qualified':
      case 'Viewing Booked':
        return 'default'
      case 'Reserved':
      case 'Completed':
        return 'success'
      case 'Lost':
      case 'Not Proceeding':
        return 'destructive'
      default:
        return 'muted'
    }
  }

  return (
    <EditableCell
      value={value}
      field={field}
      rowId={rowId}
      type="select"
      options={options}
      onSave={onSave}
      displayValue={value?.toString()}
      badgeVariant={getStatusVariant(value?.toString())}
      className={className}
    />
  )
}
