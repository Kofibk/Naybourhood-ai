'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import { ScoreBadge } from './ScoreBadge'
import {
  Loader2,
  GripVertical,
  ChevronRight,
  TrendingUp,
  Users,
} from 'lucide-react'
import Link from 'next/link'

interface PipelineBuyer {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  status: string
  final_score?: number
  ai_quality_score?: number
  ai_classification?: string
  budget_min?: number
  budget_max?: number
  development_name?: string
  days_in_status?: number
  date_added?: string
}

interface PipelineColumn {
  id: string
  label: string
  color: string
  buyers: PipelineBuyer[]
  totalValue: number
}

const PIPELINE_STAGES = [
  { id: 'Contact Pending', label: 'New / Contact Pending', color: 'border-blue-500/40' },
  { id: 'Follow Up', label: 'Contacted', color: 'border-amber-500/40' },
  { id: 'Viewing Booked', label: 'Viewing Booked', color: 'border-purple-500/40' },
  { id: 'Negotiating', label: 'Offer Made', color: 'border-cyan-500/40' },
  { id: 'Reserved', label: 'Reservation', color: 'border-emerald-500/40' },
  { id: 'Exchanged', label: 'Exchange', color: 'border-green-500/40' },
  { id: 'Completed', label: 'Completed', color: 'border-green-600/40' },
  { id: 'Not Proceeding', label: 'Fall-Through', color: 'border-red-500/40' },
]

interface PipelineBoardProps {
  userType: string
  developmentFilter?: string
}

export function PipelineBoard({ userType, developmentFilter }: PipelineBoardProps) {
  const { user } = useAuth()
  const [columns, setColumns] = useState<PipelineColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedBuyer, setDraggedBuyer] = useState<PipelineBuyer | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const fetchPipeline = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.company_id) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      let query = supabase
        .from('buyers')
        .select('id, full_name, first_name, last_name, status, final_score, ai_quality_score, ai_classification, budget_min, budget_max, development_name, days_in_status, date_added')
        .eq('company_id', user.company_id)
        .not('status', 'in', '("Disqualified")')

      if (developmentFilter) {
        query = query.eq('development_name', developmentFilter)
      }

      const { data, error } = await query.order('final_score', { ascending: false, nullsFirst: false })

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Pipeline] Error fetching buyers:', error)
        }
        setIsLoading(false)
        return
      }

      const buyers = (data || []) as PipelineBuyer[]

      const pipelineColumns: PipelineColumn[] = PIPELINE_STAGES.map((stage) => {
        const stageBuyers = buyers.filter((b) => {
          const status = (b.status || 'Contact Pending').trim()
          return status === stage.id
        })

        const totalValue = stageBuyers.reduce((sum, b) => {
          return sum + (b.budget_max || b.budget_min || 0)
        }, 0)

        return {
          id: stage.id,
          label: stage.label,
          color: stage.color,
          buyers: stageBuyers,
          totalValue,
        }
      })

      setColumns(pipelineColumns)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Pipeline] Error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id, developmentFilter])

  useEffect(() => {
    fetchPipeline()
  }, [fetchPipeline])

  const handleDragStart = (buyer: PipelineBuyer) => {
    setDraggedBuyer(buyer)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (targetColumnId: string) => {
    if (!draggedBuyer || draggedBuyer.status === targetColumnId) {
      setDraggedBuyer(null)
      setDragOverColumn(null)
      return
    }

    // Optimistic update
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === draggedBuyer.status) {
          return {
            ...col,
            buyers: col.buyers.filter((b) => b.id !== draggedBuyer.id),
            totalValue: col.totalValue - (draggedBuyer.budget_max || draggedBuyer.budget_min || 0),
          }
        }
        if (col.id === targetColumnId) {
          const updatedBuyer = { ...draggedBuyer, status: targetColumnId }
          return {
            ...col,
            buyers: [...col.buyers, updatedBuyer],
            totalValue: col.totalValue + (draggedBuyer.budget_max || draggedBuyer.budget_min || 0),
          }
        }
        return col
      })
    )

    // Update in database
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient()
        await supabase
          .from('buyers')
          .update({
            status: targetColumnId,
            status_last_modified: new Date().toISOString(),
            days_in_status: 0,
          })
          .eq('id', draggedBuyer.id)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Pipeline] Error updating status:', err)
        }
        // Revert on error
        fetchPipeline()
      }
    }

    setDraggedBuyer(null)
    setDragOverColumn(null)
  }

  // Calculate conversion rates between stages
  const getConversionRate = (fromIndex: number, toIndex: number): string => {
    if (fromIndex >= columns.length || toIndex >= columns.length) return '-'
    const from = columns[fromIndex].buyers.length
    const to = columns[toIndex].buyers.length
    if (from === 0) return '-'
    return `${Math.round((to / from) * 100)}%`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalBuyers = columns.reduce((sum, col) => sum + col.buyers.length, 0)

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center gap-4 text-sm text-white/50">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {totalBuyers} total
        </span>
        {columns[0].buyers.length > 0 && columns[4].buyers.length > 0 && (
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            New to Reservation: {getConversionRate(0, 4)}
          </span>
        )}
      </div>

      {/* Pipeline columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
        {columns.map((column, index) => (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(column.id)}
            className={`flex-shrink-0 w-[250px] bg-[#0d0d0d] border rounded-xl transition-colors ${
              dragOverColumn === column.id
                ? 'border-primary/50 bg-primary/5'
                : `border-white/10 ${column.color}`
            }`}
          >
            {/* Column header */}
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-white/70 truncate">{column.label}</h4>
                <span className="text-xs font-bold text-white bg-white/10 rounded-full px-2 py-0.5">
                  {column.buyers.length}
                </span>
              </div>
              {column.totalValue > 0 && (
                <p className="text-[10px] text-white/30">{formatCurrency(column.totalValue)}</p>
              )}
              {index > 0 && columns[index - 1].buyers.length > 0 && (
                <p className="text-[10px] text-emerald-400/60 mt-0.5">
                  {getConversionRate(index - 1, index)} from {columns[index - 1].label}
                </p>
              )}
            </div>

            {/* Buyer cards */}
            <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
              {column.buyers.map((buyer) => {
                const basePath = userType === 'broker' ? `/${userType}/borrowers` : `/${userType}/buyers`

                return (
                  <div
                    key={buyer.id}
                    draggable
                    onDragStart={() => handleDragStart(buyer)}
                    className="bg-[#111111] border border-white/10 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-white/20 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`${basePath}/${buyer.id}`}
                          className="text-white text-sm font-medium hover:text-primary truncate block"
                        >
                          {buyer.full_name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim()}
                        </Link>
                        {buyer.development_name && (
                          <p className="text-[10px] text-white/30 truncate mt-0.5">
                            {buyer.development_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          {(buyer.final_score || buyer.ai_quality_score) && (
                            <ScoreBadge
                              score={buyer.final_score || buyer.ai_quality_score || 0}
                              size="sm"
                            />
                          )}
                          {buyer.days_in_status != null && buyer.days_in_status > 0 && (
                            <span className="text-[10px] text-white/30">
                              {buyer.days_in_status}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {column.buyers.length === 0 && (
                <div className="text-center py-6 text-white/20 text-xs">
                  No leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
