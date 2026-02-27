'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useLeads } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Phone, Mail, Eye, FileText, Flame, Heart, Users } from 'lucide-react'
import { LeadIntakeForm } from '@/components/leads/LeadIntakeForm'

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
  const { user, isLoading: authLoading } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const cfg = config[userType]

  const myLeads = useMemo(() => {
    if (!user?.company_id) return leads
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
      const hot = myLeads.filter(l => (l.quality_score || 0) >= 85).length
      return `${filteredLeads.length} buyers \u2022 ${hot} hot leads`
    }
    const approved = myLeads.filter(l => l.mortgage_status === 'Approved').length
    return `${myLeads.length} clients \u2022 ${approved} approved`
  }, [myLeads, filteredLeads.length, userType])

  if (!authLoading && !user?.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{cfg.title}</h2>
          <p className="text-sm text-white/50">{cfg.subtitle}</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl p-12 text-center">
          <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">No company linked</p>
          <p className="text-sm text-white/30 mt-2">Your account is not linked to a company. Contact an administrator to assign you to a company.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{cfg.title}</h2>
          <p className="text-sm text-white/50">{statsText}</p>
        </div>
        <LeadIntakeForm />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder={cfg.searchPlaceholder}
            className="pl-9 bg-[#111111] border-white/10 text-white placeholder:text-white/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={statusFilter !== 'all' ? 'border-white/10 text-white/70 hover:bg-white/5' : ''}
          >
            All
          </Button>
          {cfg.statusOptions.map(s => (
            <Button
              key={s.value}
              variant={statusFilter === s.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s.value)}
              className={statusFilter !== s.value ? 'border-white/10 text-white/70 hover:bg-white/5' : ''}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#111111] border border-white/10 rounded-xl p-4 animate-pulse">
                <div className="h-4 w-32 bg-white/10 rounded mb-3" />
                <div className="h-3 w-48 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="col-span-full bg-[#111111] border border-white/10 rounded-xl p-12 text-center">
            <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">{myLeads.length === 0 ? cfg.emptyMessage : cfg.noMatchMessage}</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-[#111111] border border-white/10 rounded-xl p-4 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {(lead.quality_score || 0) >= 85 && (
                    <Flame className="h-4 w-4 text-orange-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{lead.full_name}</h3>
                    <p className="text-sm text-white/40">{lead.email}</p>
                  </div>
                </div>
                {userType === 'agent' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">
                    {userType === 'agent' ? 'Budget:' : 'Required:'}
                  </span>
                  <span className="font-medium text-white">{lead.budget || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">Timeline:</span>
                  <span className="text-white/70">{lead.timeline || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  {userType === 'agent' ? (
                    <>
                      <span className="text-white/40">Location:</span>
                      <span className="text-white/70">{lead.location || 'N/A'}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white/40">Mortgage Status:</span>
                      <Badge variant={lead.mortgage_status === 'Approved' ? 'success' : 'secondary'}>
                        {lead.mortgage_status || 'Pending'}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Badge className={(lead.quality_score || 0) >= 85 ? 'bg-amber-400/10 text-amber-400 border-0' : 'bg-white/5 text-white/50 border-0'}>
                    Q: {lead.quality_score || 0}
                  </Badge>
                  {userType === 'broker' && lead.proof_of_funds && (
                    <Badge className="bg-emerald-400/10 text-emerald-400 border-0">Verified</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-white"
                    onClick={() => lead.phone && window.open(`tel:${lead.phone}`)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-white"
                    onClick={() => lead.email && window.open(`mailto:${lead.email}`)}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                    {userType === 'agent' ? <Eye className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
