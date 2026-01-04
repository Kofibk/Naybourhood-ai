'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Heart, Phone, Mail, Eye, MapPin, Users } from 'lucide-react'

export default function MatchesPage() {
  const { leads } = useData()
  const { user } = useAuth()

  // Filter leads by company_id first
  const myLeads = useMemo(() => {
    if (!user?.company_id) return []
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  // Get top matches (highest quality scores)
  const matches = useMemo(() => {
    return [...myLeads]
      .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
      .slice(0, 6)
  }, [myLeads])

  if (!user?.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">My Matches</h2>
          <p className="text-sm text-muted-foreground">Buyers matched to your developments</p>
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
      <div>
        <h2 className="text-2xl font-bold font-display">My Matches</h2>
        <p className="text-sm text-muted-foreground">
          Buyers matched to your developments
        </p>
      </div>

      {/* Matches Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {matches.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{lead.full_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {lead.location || 'London'}
                    </div>
                  </div>
                </div>
                <Badge variant="success">92% Match</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Budget</div>
                  <div className="font-medium text-sm">{lead.budget || 'N/A'}</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Timeline</div>
                  <div className="font-medium text-sm">{lead.timeline || 'N/A'}</div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Bedrooms</div>
                  <div className="font-medium text-sm">
                    {lead.bedrooms || 'Any'}
                  </div>
                </div>
                <div className="p-2 rounded bg-muted/50">
                  <div className="text-xs text-muted-foreground">Score</div>
                  <div className="font-medium text-sm">Q: {lead.quality_score || 0}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" size="icon">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
