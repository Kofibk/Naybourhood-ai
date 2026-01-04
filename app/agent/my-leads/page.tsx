'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lead, PriorityAction } from '@/types'
import { LeadTable } from '@/components/leads'
import { AgentStats } from '@/components/dashboard/AgentStats'
import { PriorityActionsCompact } from '@/components/dashboard/PriorityActions'
import { fetchMyLeads, fetchPriorityActions } from '@/lib/queries/leads'
import { Target, ChevronRight } from 'lucide-react'

export default function AgentMyLeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [priorityActions, setPriorityActions] = useState<PriorityAction[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    // Get user from localStorage
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const user = JSON.parse(stored)
      setUserName(user.name || '')
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      if (!userName) return

      setLoading(true)
      try {
        const [leadsData, actionsData] = await Promise.all([
          fetchMyLeads(userName),
          fetchPriorityActions(userName, 5),
        ])

        setLeads(leadsData)
        setPriorityActions(actionsData)
      } catch (error) {
        console.error('Error loading leads:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userName])

  const handleRowClick = (lead: Lead) => {
    router.push(`/agent/my-leads/${lead.id}`)
  }

  const handleActionComplete = (actionId: string) => {
    setPriorityActions((prev) => prev.filter((a) => a.id !== actionId))
  }

  const handleAction = (action: PriorityAction) => {
    router.push(`/agent/my-leads/${action.leadId}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Leads</h1>
        <p className="text-sm text-muted-foreground">
          Your assigned leads and priority actions
        </p>
      </div>

      {/* Stats */}
      <AgentStats leads={leads} />

      {/* Priority Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Today&apos;s Priority
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg" />
              ))}
            </div>
          ) : priorityActions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No priority actions for today
            </p>
          ) : (
            <PriorityActionsCompact
              actions={priorityActions}
              onComplete={handleActionComplete}
              onAction={handleAction}
            />
          )}
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">My Leads</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No leads assigned to you yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Lead</th>
                    <th className="pb-2 font-medium">Q/I</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Next Action</th>
                    <th className="pb-2 font-medium">Days</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => handleRowClick(lead)}
                      className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-medium">{lead.fullName}</div>
                      </td>
                      <td className="py-3">
                        <span className="font-medium">{lead.qualityScore}</span>
                        <span className="text-muted-foreground">/{lead.intentScore}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs">{lead.status}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-muted-foreground">
                          {lead.aiNextAction || 'Follow up'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={lead.daysInStatus && lead.daysInStatus > 3 ? 'text-red-500' : ''}>
                          {lead.daysInStatus || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
