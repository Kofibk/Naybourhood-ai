'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Search, Filter, Phone, Mail, Eye, Flame, Heart, Users } from 'lucide-react'

export default function BuyersPage() {
  const { leads, isLoading } = useData()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter leads by company_id - only show leads assigned to the user's company
  const myLeads = useMemo(() => {
    if (!user?.company_id) {
      return [] // No company = no leads
    }
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      const matchesSearch = !search ||
        lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone?.includes(search)

      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [myLeads, search, statusFilter])

  // Stats
  const stats = useMemo(() => ({
    total: myLeads.length,
    hot: myLeads.filter(l => (l.quality_score || 0) >= 85).length,
    qualified: myLeads.filter(l => l.status === 'Qualified').length,
  }), [myLeads])

  if (!user?.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Buyers</h2>
          <p className="text-sm text-muted-foreground">
            Browse and manage your buyer database
          </p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Buyers</h2>
          <p className="text-sm text-muted-foreground">
            {filteredLeads.length} buyers • {stats.hot} hot leads
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search buyers..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Viewing Booked">Viewing Booked</option>
        </select>
      </div>

      {/* Buyers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {myLeads.length === 0 ? 'No buyers assigned yet.' : 'No buyers match your search.'}
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
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{lead.budget || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Timeline:</span>
                    <span>{lead.timeline || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{lead.location || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        (lead.quality_score || 0) >= 85
                          ? 'warning'
                          : (lead.quality_score || 0) >= 70
                          ? 'success'
                          : 'secondary'
                      }
                    >
                      Q: {lead.quality_score || 0}
                    </Badge>
                    <Badge variant="outline">I: {lead.intent_score || 0}</Badge>
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
                      <Eye className="h-4 w-4" />
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
