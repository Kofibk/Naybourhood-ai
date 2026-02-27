'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLeads } from '@/hooks/useLeads'
import { useAuth } from '@/contexts/AuthContext'
import { Heart, Phone, Mail, Eye, MapPin, Users } from 'lucide-react'

export default function MatchesPage() {
  const { leads } = useLeads()
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
          <h2 className="text-2xl font-bold font-display text-white">My Matches</h2>
          <p className="text-sm text-white/50">Buyers matched to your listings</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-xl">
          <div className="py-12 text-center">
            <Users className="h-12 w-12 text-white/50 mx-auto mb-4" />
            <p className="text-white/50">Your account is not linked to a company.</p>
            <p className="text-sm text-white/40 mt-2">
              Contact an administrator to assign you to a company.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display text-white">My Matches</h2>
        <p className="text-sm text-white/50">Buyers matched to your listings</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {matches.map((lead) => (
          <div key={lead.id} className="bg-[#111111] border border-white/10 rounded-xl">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{lead.full_name}</h3>
                    <div className="flex items-center gap-1 text-sm text-white/50">
                      <MapPin className="h-3 w-3" />
                      {lead.location || 'London'}
                    </div>
                  </div>
                </div>
                <Badge variant="success">92% Match</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded bg-white/5">
                  <div className="text-xs text-white/50">Budget</div>
                  <div className="font-medium text-sm text-white">{lead.budget || 'N/A'}</div>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <div className="text-xs text-white/50">Timeline</div>
                  <div className="font-medium text-sm text-white">{lead.timeline || 'N/A'}</div>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
