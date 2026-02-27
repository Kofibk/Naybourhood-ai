'use client'

import { Lead } from '@/types'
import { useMemo } from 'react'
import { Users, Flame, Eye, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentStatsProps {
  leads: Lead[]
  className?: string
}

export function AgentStats({ leads, className }: AgentStatsProps) {
  const stats = useMemo(() => {
    return {
      assigned: leads.length,
      hot: leads.filter((l) => l.classification === 'Hot').length,
      viewings: leads.filter((l) => l.viewingBooked).length,
      reserved: leads.filter((l) => l.status === 'Reserved').length,
    }
  }, [leads])

  const statCards = [
    { label: 'Assigned', value: stats.assigned, icon: Users, color: 'text-blue-400' },
    { label: 'Hot', value: stats.hot, icon: Flame, color: 'text-red-400' },
    { label: 'Viewings', value: stats.viewings, icon: Eye, color: 'text-purple-400' },
    { label: 'Reserved', value: stats.reserved, icon: CheckCircle, color: 'text-emerald-400' },
  ]

  return (
    <div className={cn('grid grid-cols-4 gap-3', className)}>
      {statCards.map((stat) => (
        <div key={stat.label} className="bg-[#111111] border border-white/10 rounded-xl p-4 text-center">
          <stat.icon className={cn('h-5 w-5 mx-auto mb-1', stat.color)} />
          <div className="text-2xl font-bold text-white">{stat.value}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

// Compact inline version
export function AgentStatsInline({ leads, className }: { leads: Lead[]; className?: string }) {
  const stats = useMemo(() => {
    return {
      assigned: leads.length,
      hot: leads.filter((l) => l.classification === 'Hot').length,
      viewings: leads.filter((l) => l.viewingBooked).length,
      reserved: leads.filter((l) => l.status === 'Reserved').length,
    }
  }, [leads])

  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <span>
        <span className="font-medium text-white">{stats.assigned}</span>{' '}
        <span className="text-white/40">assigned</span>
      </span>
      <span>
        <span className="font-medium text-red-400">{stats.hot}</span>{' '}
        <span className="text-white/40">hot</span>
      </span>
      <span>
        <span className="font-medium text-purple-400">{stats.viewings}</span>{' '}
        <span className="text-white/40">viewings</span>
      </span>
      <span>
        <span className="font-medium text-emerald-400">{stats.reserved}</span>{' '}
        <span className="text-white/40">reserved</span>
      </span>
    </div>
  )
}
