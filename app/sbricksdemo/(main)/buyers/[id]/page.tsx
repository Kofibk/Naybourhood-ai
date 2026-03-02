'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SB_DEMO_RECENT_LEADS } from '@/lib/demo-data-smartbricks'
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  User,
  Building,
  DollarSign,
  MapPin,
  Calendar,
  Target,
  Sparkles,
  TrendingUp,
  CheckCircle,
} from 'lucide-react'

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

export default function SBDemoBuyerDetailPage() {
  const params = useParams()
  const leadId = params.id as string

  const lead = useMemo(() => {
    return SB_DEMO_RECENT_LEADS.find(l => l.id === leadId)
  }, [leadId])

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/sbricksdemo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Buyers
        </Link>
        <div className="text-center py-20">
          <p className="text-white/50">Buyer not found</p>
        </div>
      </div>
    )
  }

  const classConfig = lead.ai_classification === 'Hot Lead'
    ? { bg: 'bg-red-600', text: 'text-white' }
    : { bg: 'bg-emerald-600', text: 'text-white' }

  return (
    <div className="space-y-6">
      <Link href="/sbricksdemo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white mb-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Buyers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <span className="text-2xl font-semibold text-emerald-400">{lead.first_name.charAt(0)}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{lead.full_name}</h2>
            <p className="text-sm text-white/50">{lead.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${classConfig.bg} ${classConfig.text}`}>{lead.ai_classification}</Badge>
              <Badge variant="secondary">{lead.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
            <Phone className="h-3.5 w-3.5 mr-1" /> Call
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
            <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
            <Mail className="h-3.5 w-3.5 mr-1" /> Email
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* AI Summary */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-emerald-400" />
              AI Summary
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">{lead.ai_summary}</p>
          </div>

          {/* Contact Details */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <User className="h-5 w-5" />
              Contact Details
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-sm text-white">{lead.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Phone</p>
                  <p className="text-sm text-white">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Development Interest</p>
                  <p className="text-sm text-white">{lead.development_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Budget Range</p>
                  <p className="text-sm text-white">{lead.budget_range}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Source</p>
                  <p className="text-sm text-white capitalize">{lead.source_platform}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-xs text-white/40">Created</p>
                  <p className="text-sm text-white">{new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              AI Recommendations
            </h3>
            <div className="space-y-3">
              {[
                'Schedule in-person viewing at the development within 48 hours',
                'Send personalised pricing and floor plan options',
                'Connect with mortgage broker if financing required',
              ].map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/70">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Scores */}
        <div className="space-y-6">
          <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Target className="h-5 w-5" />
              NB Scores
            </h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(lead.ai_quality_score || 0)}`}>
                  {lead.ai_quality_score}
                </div>
                <p className="text-xs text-white/40 mt-1">Quality Score</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${getScoreColor(lead.ai_intent_score || 0)}`}>{lead.ai_intent_score}</p>
                  <p className="text-[10px] text-white/40">Intent</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-400">{lead.ai_confidence}</p>
                  <p className="text-[10px] text-white/40">Confidence</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">Status</h3>
            <Badge variant="secondary" className="text-sm">{lead.status}</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
