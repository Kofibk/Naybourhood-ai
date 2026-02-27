'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Phone, Mail, Eye, MapPin, Building2, Sparkles, TrendingUp } from 'lucide-react'

// Demo matches for investor pitch - buyers matched to developments
const DEMO_MATCHES = [
  {
    id: 'match-1',
    buyerName: 'James Richardson',
    budget: '£2.5M - £3.5M',
    timeline: 'Ready to buy',
    bedrooms: '4-5',
    location: 'North London',
    matchScore: 96,
    development: 'The Bishops Avenue',
    developmentLocation: 'Hampstead, N2',
    matchReasons: ['Budget aligns perfectly', 'Preferred location', 'Ready timeline'],
    aiInsight: 'High probability of conversion - schedule viewing immediately',
    status: 'Hot',
  },
  {
    id: 'match-2',
    buyerName: 'Sarah Chen',
    budget: '£4M - £6M',
    timeline: 'Within 3 months',
    bedrooms: '5+',
    location: 'Prime Central',
    matchScore: 94,
    development: 'One Hyde Park',
    developmentLocation: 'Knightsbridge, SW1',
    matchReasons: ['Premium buyer', 'Investment focus', 'Cash buyer'],
    aiInsight: 'Serious investor - present portfolio of premium units',
    status: 'Hot',
  },
  {
    id: 'match-3',
    buyerName: 'Fatima Al-Hassan',
    budget: '£6M - £8M',
    timeline: 'Ready to buy',
    bedrooms: '6+',
    location: 'West London',
    matchScore: 92,
    development: 'Holland Park Villas',
    developmentLocation: 'Holland Park, W11',
    matchReasons: ['Ultra high net worth', 'Family home seeker', 'Cash ready'],
    aiInsight: 'Reserved similar property - prioritize for new releases',
    status: 'Reserved',
  },
  {
    id: 'match-4',
    buyerName: 'Michael Okonkwo',
    budget: '£1.8M - £2.2M',
    timeline: 'Ready to buy',
    bedrooms: '3-4',
    location: 'East London',
    matchScore: 89,
    development: 'The Shoreline',
    developmentLocation: 'Canary Wharf, E14',
    matchReasons: ['Budget match', 'Transport links priority', 'Modern finish preference'],
    aiInsight: 'Second viewing completed - prepare offer negotiation',
    status: 'Hot',
  },
  {
    id: 'match-5',
    buyerName: 'Emma Thompson',
    budget: '£3M - £4M',
    timeline: 'Within 6 months',
    bedrooms: '4',
    location: 'South West London',
    matchScore: 87,
    development: 'Chelsea Waterfront',
    developmentLocation: 'Chelsea, SW10',
    matchReasons: ['Lifestyle match', 'River views preference', 'Good schools nearby'],
    aiInsight: 'Young family - emphasize community features',
    status: 'Warm',
  },
  {
    id: 'match-6',
    buyerName: 'Alexandra Müller',
    budget: '£2M - £3M',
    timeline: 'Investment',
    bedrooms: '2-3',
    location: 'Central London',
    matchScore: 85,
    development: 'City Tower',
    developmentLocation: 'City of London, EC2',
    matchReasons: ['Investment focus', 'Rental yield priority', 'International buyer'],
    aiInsight: 'Investment buyer - present yield projections',
    status: 'Warm',
  },
]

export default function MatchesPage() {
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const user = JSON.parse(stored)
      setIsDemo(user.isDemo === true)
    }
  }, [])

  const matches = isDemo ? DEMO_MATCHES : []

  const totalPipelineValue = matches.reduce((sum, m) => {
    const match = m.budget.match(/£([\d.]+)M/)
    return sum + (match ? parseFloat(match[1]) * 1000000 : 0)
  }, 0)

  const hotMatches = matches.filter(m => m.status === 'Hot').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-white">My Matches</h2>
          <p className="text-sm text-white/50">
            AI-powered buyer-development matching
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-[#111111] border border-emerald-500/20 rounded-xl">
            <div className="p-3 flex items-center gap-2">
              <Heart className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-lg font-bold text-emerald-400">{matches.length}</p>
                <p className="text-[10px] text-white/50">Matches</p>
              </div>
            </div>
          </div>
          <div className="bg-[#111111] border border-orange-500/20 rounded-xl">
            <div className="p-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-orange-500">{hotMatches}</p>
                <p className="text-[10px] text-white/50">Hot Leads</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {matches.length === 0 && (
          <div className="md:col-span-2 bg-[#111111] border border-white/10 rounded-xl">
            <div className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto text-white/50 mb-4" />
              <h3 className="font-semibold text-white mb-2">No matches yet</h3>
              <p className="text-sm text-white/50">AI-powered buyer matches will appear here</p>
            </div>
          </div>
        )}
        {matches.map((match) => (
          <div key={match.id} className="bg-[#111111] border border-white/10 rounded-xl hover:border-emerald-500/30 transition-colors">
            <div className="p-5 border-b border-white/5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    match.status === 'Hot' ? 'bg-orange-500/20' : match.status === 'Reserved' ? 'bg-green-500/20' : 'bg-emerald-500/10'
                  }`}>
                    <Heart className={`h-6 w-6 ${
                      match.status === 'Hot' ? 'text-orange-500' : match.status === 'Reserved' ? 'text-green-500' : 'text-emerald-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">{match.buyerName}</h3>
                    <div className="flex items-center gap-1 text-sm text-white/50">
                      <MapPin className="h-3 w-3" />
                      {match.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={match.status === 'Hot' ? 'destructive' : match.status === 'Reserved' ? 'success' : 'warning'}>
                    {match.matchScore}% Match
                  </Badge>
                  <p className="text-[10px] text-white/40 mt-1">{match.status}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* Matched Development */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-sm text-white">{match.development}</span>
                </div>
                <p className="text-xs text-white/50">{match.developmentLocation}</p>
              </div>

              {/* Buyer Details */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Budget</div>
                  <div className="font-medium text-sm text-white">{match.budget}</div>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Timeline</div>
                  <div className="font-medium text-sm text-white">{match.timeline}</div>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Bedrooms</div>
                  <div className="font-medium text-sm text-white">{match.bedrooms}</div>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <div className="text-[10px] text-white/40 uppercase">Score</div>
                  <div className="font-medium text-sm text-white">Q: {match.matchScore}</div>
                </div>
              </div>

              {/* Match Reasons */}
              <div className="flex flex-wrap gap-1">
                {match.matchReasons.map((reason, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {reason}
                  </Badge>
                ))}
              </div>

              {/* AI Insight */}
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {match.aiInsight}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button className="flex-1" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
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
