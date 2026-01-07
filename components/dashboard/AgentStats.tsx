'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    { label: 'Assigned', value: stats.assigned, icon: Users, color: 'text-blue-500' },
    { label: 'Hot', value: stats.hot, icon: Flame, color: 'text-red-500' },
    { label: 'Viewings', value: stats.viewings, icon: Eye, color: 'text-purple-500' },
    { label: 'Reserved', value: stats.reserved, icon: CheckCircle, color: 'text-green-500' },
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">My Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {statCards.map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/50">
              <stat.icon className={cn('h-5 w-5 mx-auto mb-1', stat.color)} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
        <span className="font-medium">{stats.assigned}</span>{' '}
        <span className="text-muted-foreground">assigned</span>
      </span>
      <span>
        <span className="font-medium text-red-500">{stats.hot}</span>{' '}
        <span className="text-muted-foreground">hot</span>
      </span>
      <span>
        <span className="font-medium text-purple-500">{stats.viewings}</span>{' '}
        <span className="text-muted-foreground">viewings</span>
      </span>
      <span>
        <span className="font-medium text-green-500">{stats.reserved}</span>{' '}
        <span className="text-muted-foreground">reserved</span>
      </span>
    </div>
  )
}
