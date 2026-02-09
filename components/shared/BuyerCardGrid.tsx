'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useLeads } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingState } from '@/components/ui/loading-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClassificationBadge } from '@/components/badges/ClassificationBadge'
import { RiskFlagList } from '@/components/badges/RiskFlagBadge'
import { NBScoreInline } from '@/components/scoring/NBScoreHero'
import { Search, Phone, Mail, Eye, FileText, Heart, Users } from 'lucide-react'

type UserType = 'agent' | 'broker'

interface BuyerCardGridProps {
  userType: UserType
}

const config = {
  agent: {
    title: 'Buyer Database',
    subtitle: 'Access qualified buyers for your listings',
    searchPlaceholder: 'Search buyers...',
    emptyMessage: 'No buyers available.',
    noMatchMessage: 'No buyers match your search.',
    statusOptions: [
      { value: 'New', label: 'New' },
      { value: 'Contacted', label: 'Contacted' },
      { value: 'Qualified', label: 'Qualified' },
      { value: 'Viewing Booked', label: 'Viewing Booked' },
    ],
  },
  broker: {
    title: 'Assigned Clients',
    subtitle: 'Manage your mortgage leads',
    searchPlaceholder: 'Search clients...',
    emptyMessage: 'No clients assigned yet.',
    noMatchMessage: 'No clients match your search.',
    statusOptions: [
      { value: 'Pending', label: 'Pending' },
      { value: 'In Progress', label: 'In Progress' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Declined', label: 'Declined' },
    ],
  },
} as const

export function BuyerCardGrid({ userType }: BuyerCardGridProps) {
  const { leads, isLoading } = useLeads()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const cfg = config[userType]

  const myLeads = useMemo(() => {
    if (!user?.company_id) return []
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      const matchesSearch = !search ||
        lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search)

      const matchesStatus = statusFilter === 'all' ||
        lead.status === statusFilter ||
        (userType === 'broker' && lead.mortgage_status === statusFilter)

      return matchesSearch && matchesStatus
    })
  }, [myLeads, search, statusFilter, userType])

  const statsText = useMemo(() => {
    if (userType === 'agent') {
      const hot = myLeads.filter(l => l.ai_classification === 'Hot' || (l.quality_score || 0) >= 85).length
      return `${filteredLeads.length} buyers \u2022 ${hot} hot leads`
    }
    const approved = myLeads.filter(l => l.mortgage_status === 'Approved').length
    return `${myLeads.length} clients \u2022 ${approved} approved`
  }, [myLeads, filteredLeads.length, userType])

  if (!user?.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">{cfg.title}</h2>
          <p className="text-sm text-muted-foreground">{cfg.subtitle}</p>
        </div>
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="No company linked"
              description="Your account is not linked to a company. Contact an administrator to assign you to a company."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">{cfg.title}</h2>
          <p className="text-sm text-muted-foreground">{statsText}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={cfg.searchPlaceholder}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {cfg.statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full">
            <LoadingState text="Loading..." />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={Users}
              title={myLeads.length === 0 ? cfg.emptyMessage : cfg.noMatchMessage}
            />
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                {/* NB Score Hero + Classification */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <NBScoreInline
                      qualityScore={lead.ai_quality_score ?? lead.quality_score}
                      intentScore={lead.ai_intent_score ?? lead.intent_score}
                    />
                    <ClassificationBadge
                      classification={lead.ai_classification || 'Cold'}
                      size="sm"
                    />
                  </div>
                  {userType === 'agent' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Heart className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="mb-3">
                  <h3 className="font-semibold">{lead.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {userType === 'agent' ? 'Budget:' : 'Required:'}
                    </span>
                    <span className="font-medium">{lead.budget || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span>{lead.timeline || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    {userType === 'agent' ? (
                      <>
                        <span className="text-muted-foreground">Location:</span>
                        <span>{lead.location || 'N/A'}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-muted-foreground">Mortgage Status:</span>
                        <Badge variant={lead.mortgage_status === 'Approved' ? 'success' : 'secondary'}>
                          {lead.mortgage_status || 'Pending'}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Risk Flags as inline badges */}
                {lead.ai_risk_flags && lead.ai_risk_flags.length > 0 && (
                  <div className="mb-3">
                    <RiskFlagList flags={lead.ai_risk_flags.slice(0, 2)} />
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    {userType === 'broker' && lead.proof_of_funds && (
                      <Badge variant="success">Verified</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => lead.phone && window.open(`tel:${lead.phone}`)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => lead.email && window.open(`mailto:${lead.email}`)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {userType === 'agent' ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
