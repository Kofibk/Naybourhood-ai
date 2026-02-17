'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useChecklistProgress } from '@/hooks/useChecklistProgress'
import type { ChecklistItem } from '@/lib/checklist'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  X,
  Rocket,
  Loader2,
} from 'lucide-react'

type UserType = 'developer' | 'agent' | 'broker'

interface OnboardingChecklistProps {
  userId: string
  companyId: string
  userType: UserType
}

export function OnboardingChecklist({
  userId,
  companyId,
  userType,
}: OnboardingChecklistProps) {
  const {
    items,
    completedItems,
    isLoading,
    isDismissed,
    totalItems,
    completedCount,
    allComplete,
    dismissChecklist,
  } = useChecklistProgress(userId, companyId, userType)

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="text-white/60 text-sm">Loading setup guide...</span>
        </div>
      </div>
    )
  }

  if (isDismissed) {
    return null
  }

  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6 relative">
      {/* Dismiss button - only when all complete */}
      {allComplete && (
        <button
          onClick={dismissChecklist}
          className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors"
          aria-label="Dismiss setup guide"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
          <Rocket className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-base">
            {allComplete ? 'Setup Complete!' : 'Get Started'}
          </h3>
          <p className="text-white/50 text-sm">
            {allComplete
              ? 'You\'re all set. Dismiss this guide when ready.'
              : `${completedCount} of ${totalItems} complete`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-white/10 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            isComplete={completedItems.has(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ChecklistRow({
  item,
  isComplete,
}: {
  item: ChecklistItem
  isComplete: boolean
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
        isComplete
          ? 'opacity-60'
          : 'hover:bg-white/5'
      )}
    >
      {isComplete ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-white/30 flex-shrink-0 group-hover:text-white/50" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            isComplete ? 'text-white/50 line-through' : 'text-white'
          )}
        >
          {item.label}
        </p>
        {!isComplete && (
          <p className="text-xs text-white/40 mt-0.5">{item.description}</p>
        )}
      </div>
      {!isComplete && (
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0 group-hover:text-white/40" />
      )}
    </Link>
  )
}
