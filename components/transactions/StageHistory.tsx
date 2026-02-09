'use client'

import { useState } from 'react'
import { STAGE_LABELS } from '@/types/transactions'
import type { StageHistoryEntry } from '@/types/transactions'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StageHistoryProps {
  history: StageHistoryEntry[] | unknown
}

export function StageHistory({ history: rawHistory }: StageHistoryProps) {
  const [showHistory, setShowHistory] = useState(false)

  const history: StageHistoryEntry[] = Array.isArray(rawHistory)
    ? rawHistory
    : []

  if (history.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showHistory ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        Stage History ({history.length})
      </button>
      {showHistory && (
        <div className="mt-2 space-y-2">
          {history.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full mt-1.5',
                    entry.stage === 'fallen_through'
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  )}
                />
                {i < history.length - 1 && (
                  <div className="w-px h-6 bg-border" />
                )}
              </div>
              <div className="pb-2">
                <span className="font-medium">
                  {STAGE_LABELS[entry.stage] || entry.stage}
                </span>
                <span className="text-muted-foreground ml-2">
                  {new Date(entry.timestamp).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {entry.notes && (
                  <p className="text-muted-foreground mt-0.5">{entry.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
