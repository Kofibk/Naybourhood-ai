'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Phone, Mail, Eye, FileText, Flame, Heart, Users } from 'lucide-react'

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
  const { leads, isLoading } = useData()
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
      const hot = myLeads.filter(l => (l.quality_score || 0) >= 85).length
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
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your account is not linked to a company.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact an administrator to assign you to a company.
            </p>
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
        <select
          className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[150px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          {cfg.statusOptions.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {myLeads.length === 0 ? cfg.emptyMessage : cfg.noMatchMessage}
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {(lead.quality_score || 0) >= 85 && (
                      <Flame className="h-4 w-4 text-orange-500" />
                    )}
                    <div>
                      <h3 className="font-semibold">{lead.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                  </div>
                  {userType === 'agent' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Heart className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2 mb-4">
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

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant={(lead.quality_score || 0) >= 85 ? 'warning' : 'secondary'}>
                      Q: {lead.quality_score || 0}
                    </Badge>
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
