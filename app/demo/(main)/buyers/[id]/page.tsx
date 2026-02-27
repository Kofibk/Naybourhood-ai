'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import { getNBScoreColor } from '@/lib/scoring/nb-score'
import { DEMO_RECENT_LEADS } from '@/lib/demo-data'
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
  Clock,
  Target,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react'

const CLASSIFICATION_CONFIG: Record<string, { bg: string; text: string; label: string; ringBg: string }> = {
  'Hot Lead': { bg: 'bg-red-600', text: 'text-white', label: 'Hot Lead', ringBg: 'bg-red-500/10 border-red-500/30' },
  'Qualified': { bg: 'bg-emerald-600', text: 'text-white', label: 'Qualified', ringBg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Needs Qualification': { bg: 'bg-amber-500', text: 'text-white', label: 'Needs Qualification', ringBg: 'bg-amber-500/10 border-amber-500/30' },
  'Nurture': { bg: 'bg-blue-500', text: 'text-white', label: 'Nurture', ringBg: 'bg-blue-500/10 border-blue-500/30' },
  'Cold': { bg: 'bg-gray-400', text: 'text-white', label: 'Cold', ringBg: 'bg-gray-400/10 border-gray-400/30' },
}

function SubScoreBar({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }) {
  const percentage = Math.min((score / maxScore) * 100, 100)
  const color = getNBScoreColor(score)
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/50">{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{score}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium text-white text-right max-w-[60%] truncate">{value || '-'}</span>
    </div>
  )
}

export default function DemoBuyerDetailPage() {
  const params = useParams()

  const lead = useMemo(() => {
    return DEMO_RECENT_LEADS.find((l) => l.id === params.id)
  }, [params.id])

  if (!lead) {
    return (
      <div className="space-y-6">
        <Link href="/demo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Buyers
        </Link>
        <Card className="bg-[#111111] border-white/10">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-white mb-2">Buyer not found</h3>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const nbScore = lead.final_score || lead.ai_quality_score || 0
  const classification = lead.ai_classification || 'Cold'
  const classConfig = CLASSIFICATION_CONFIG[classification] || CLASSIFICATION_CONFIG['Cold']
  const confidencePercent = (lead.ai_confidence || 0) <= 1 ? Math.round((lead.ai_confidence || 0) * 100) : Math.round((lead.ai_confidence || 0) * 10)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Generate contextual next action based on status
  const getNextAction = () => {
    switch (lead.status) {
      case 'Contact Pending': return 'Make initial contact via phone or WhatsApp. Verify identity and confirm interest.'
      case 'Follow Up': return 'Follow up on previous conversation. Share development brochure and schedule a viewing.'
      case 'Viewing Booked': return 'Confirm viewing appointment. Prepare property details and pricing information.'
      case 'Negotiating': return 'Follow up on offer status. Discuss pricing flexibility and completion timeline.'
      default: return 'Contact this lead to confirm interest and timeline.'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/demo/buyers" className="flex items-center gap-2 text-white/50 hover:text-white mb-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Buyers
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {lead.full_name}
          </h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/50 mt-1">
            {lead.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {lead.email}
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {lead.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* NB Score Hero */}
      <Card className={`border ${classConfig.ringBg} bg-[#111111]`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex flex-col items-center flex-shrink-0">
              <NBScoreRing score={nbScore} size={120} strokeWidth={10} label="NB Score" />
            </div>
            <div className="flex-1 space-y-5 w-full">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${classConfig.bg} ${classConfig.text} text-base px-4 py-1.5`}>
                  {classConfig.label}
                </Badge>
                <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                  <TrendingUp className="w-3 h-3 mr-1" /> High conversion probability
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SubScoreBar label="Quality" score={lead.ai_quality_score || 0} />
                <SubScoreBar label="Intent" score={lead.ai_intent_score || 0} />
                <SubScoreBar label="Confidence" score={confidencePercent} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      {lead.ai_summary && (
        <Card className="bg-[#111111] border-blue-500/30">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-400 mb-1">AI Summary</h4>
                <p className="text-sm text-white/70 leading-relaxed">{lead.ai_summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Next Action */}
      <Card className="bg-[#111111] border-emerald-500/30">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white mb-1">Recommended Next Action</h4>
              <p className="text-sm text-white/60 mb-3">{getNextAction()}</p>
              <div className="flex gap-2 flex-wrap">
                {lead.phone && (
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Phone className="w-4 h-4 mr-1" /> Call
                  </Button>
                )}
                {lead.email && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    <Mail className="w-4 h-4 mr-1" /> Send Email
                  </Button>
                )}
                {lead.phone && (
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                    <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Status */}
          <Card className="bg-[#111111] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {['Contact Pending', 'Follow Up', 'Viewing Booked', 'Negotiating', 'Reserved', 'Exchanged', 'Completed', 'Not Proceeding'].map((status) => (
                  <Button
                    key={status}
                    variant={lead.status === status ? 'default' : 'outline'}
                    size="sm"
                    className={`justify-start ${lead.status !== status ? 'border-white/10 text-white/60 hover:bg-white/5' : ''}`}
                  >
                    {lead.status === status && <CheckCircle className="w-3 h-3 mr-1" />}
                    {status}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-[#111111] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white/5 rounded-lg p-3 min-h-[80px]">
                <p className="text-sm text-white/40 italic">Click to add notes about this buyer...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Contact */}
          <Card className="bg-[#111111] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <User className="w-4 h-4 text-white/50" /> Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Name" value={lead.full_name} icon={User} />
              <DataRow label="Email" value={lead.email} icon={Mail} />
              <DataRow label="Phone" value={lead.phone} icon={Phone} />
            </CardContent>
          </Card>

          {/* Property Requirements */}
          <Card className="bg-[#111111] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-white/50" /> Property Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Budget" value={lead.budget_range} icon={DollarSign} />
              <DataRow label="Development" value={lead.development_name} icon={Building} />
              <DataRow label="Source" value={lead.source_platform} icon={MapPin} />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-[#111111] border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/50" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <DataRow label="Date Added" value={formatDate(lead.created_at)} icon={Calendar} />
              <DataRow label="Status" value={lead.status} />
              <DataRow label="Source" value={lead.source_platform} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
