'use client'

import Link from 'next/link'
import { ScoreBadge } from './ScoreBadge'
import { ClassificationPill } from './ClassificationPill'
import { NextActionButton } from './NextActionButton'
import { ChevronRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadCardProps {
  id: string
  firstName?: string
  lastName?: string
  fullName?: string
  nbScore: number
  classification: string
  aiSummary?: string
  aiNextAction?: string
  developmentName?: string
  dateAdded?: string
  lastFollowup?: string
  lastReply?: string
  userType: string
}

function getTimeAgo(dateStr?: string): string {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 7)}w ago`
}

export function LeadCard({
  id,
  firstName,
  lastName,
  fullName,
  nbScore,
  classification,
  aiSummary,
  aiNextAction,
  developmentName,
  dateAdded,
  lastFollowup,
  lastReply,
  userType,
}: LeadCardProps) {
  const displayName = fullName || `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown'
  const initials = (firstName?.[0] || displayName[0] || 'U').toUpperCase()

  // Get most recent contact date
  const dates = [dateAdded, lastFollowup, lastReply].filter(Boolean) as string[]
  const mostRecent = dates.length > 0
    ? dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    : undefined
  const timeAgo = getTimeAgo(mostRecent)

  const basePath = userType === 'broker' ? `/${userType}/borrowers` : `/${userType}/buyers`

  return (
    <Link
      href={`${basePath}/${id}`}
      className="flex items-center gap-4 p-4 bg-[#111111] border border-white/10 rounded-xl hover:border-white/20 hover:bg-white/[0.03] transition-all group"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-semibold text-sm">{initials}</span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white font-medium text-sm truncate">{displayName}</p>
          <ClassificationPill classification={classification} size="sm" />
        </div>

        {aiSummary && (
          <p className="text-white/50 text-xs truncate max-w-[400px]">{aiSummary}</p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          {aiNextAction && (
            <NextActionButton
              action={aiNextAction}
              onClick={(e: React.MouseEvent) => e.preventDefault()}
              size="sm"
            />
          )}
          {developmentName && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">
              {developmentName}
            </span>
          )}
        </div>
      </div>

      {/* Score + time */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <ScoreBadge score={nbScore} size="sm" />
        {timeAgo && (
          <span className="flex items-center gap-1 text-[10px] text-white/30">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0" />
    </Link>
  )
}
