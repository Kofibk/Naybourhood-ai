'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useMountAnvilDemo } from '@/contexts/MountAnvilDemoContext'
import {
  DEMO_BUYERS,
  DEMO_DEVELOPMENTS,
  getBehaviouralAnalytics,
} from '@/lib/mount-anvil-demo-data'
import { formatCurrency } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Building2,
  LogOut,
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Flame,
  Globe,
  Wallet,
  Home,
  BedDouble,
  Target,
  TrendingUp,
  FileText,
  Eye,
  MousePointer,
  Timer,
  Video,
  Send,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Shield,
  User,
  Briefcase,
  MapPin,
} from 'lucide-react'

// Score ring component
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 36
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-white/50 text-sm mt-2">{label}</span>
    </div>
  )
}

// Classification badge
function ClassificationBadge({ classification }: { classification?: string }) {
  const styles: Record<string, { bg: string; border: string; text: string; icon: boolean }> = {
    'Hot Lead': { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: true },
    'Qualified': { bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: false },
    'Needs Qualification': { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', icon: false },
    'Nurture': { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: false },
    'Low Priority': { bg: 'bg-slate-500/20', border: 'border-slate-500/30', text: 'text-slate-400', icon: false },
  }

  const style = styles[classification || ''] || styles['Low Priority']

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border ${style.bg} ${style.border} ${style.text}`}>
      {style.icon && <Flame className="w-4 h-4" />}
      {classification || 'Unknown'}
    </span>
  )
}

// Risk flag badge
function RiskFlagBadge({ flag }: { flag: string }) {
  const labels: Record<string, string> = {
    'time_sensitive_visa': 'Visa Timeline',
    'no_finance_confirmation': 'No Finance Confirmed',
    'overseas_buyer': 'Overseas Buyer',
    'currency_transfer': 'Currency Transfer',
    'incomplete_data': 'Incomplete Data',
    'chain_dependent': 'Chain Dependent',
    'comparing_competitors': 'Comparing Options',
    'long_timeline': 'Long Timeline',
    'budget_mismatch': 'Budget Mismatch',
    'language_barrier': 'Language Barrier',
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-xs font-medium">
      <AlertCircle className="w-3 h-3" />
      {labels[flag] || flag}
    </span>
  )
}

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading, logout } = useMountAnvilDemo()
  const [showCallModal, setShowCallModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  const leadId = params.id as string
  const lead = DEMO_BUYERS.find(b => b.id === leadId)
  const development = lead ? DEMO_DEVELOPMENTS.find(d => d.id === lead.development_id) : null
  const behavioural = lead ? getBehaviouralAnalytics(lead.id) : null

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/mount-anvil-demo/login')
    }
  }, [isLoading, isAuthenticated, router])

  const handleLogout = () => {
    logout()
    router.push('/mount-anvil-demo/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/50">Lead not found</p>
          <Link href="/mount-anvil-demo/leads" className="text-emerald-400 text-sm mt-2 hover:underline">
            Back to leads
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight">Naybourhood</h1>
              <p className="text-white/40 text-xs">Mount Anvil</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/mount-anvil-demo"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/mount-anvil-demo/leads"
            className="flex items-center gap-3 px-4 py-3 text-white bg-white/5 rounded-xl"
          >
            <Users className="w-5 h-5" />
            Leads
          </Link>
          <Link
            href="/mount-anvil-demo/campaigns"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Megaphone className="w-5 h-5" />
            Campaigns
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-medium">
                {user.firstName.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{user.firstName}</p>
                <p className="text-white/40 text-xs">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/mount-anvil-demo/leads"
                className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="text-white text-2xl font-bold">{lead.full_name}</h2>
                <p className="text-white/50 text-sm mt-0.5">
                  {lead.development_name} &bull; Added {new Date(lead.created_at || '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClassificationBadge classification={lead.ai_classification} />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="col-span-2 space-y-6">
              {/* AI Summary Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-2">AI Summary</h3>
                    <p className="text-white/70 leading-relaxed">{lead.ai_summary}</p>
                    {lead.ai_risk_flags && lead.ai_risk_flags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {lead.ai_risk_flags.map((flag) => (
                          <RiskFlagBadge key={flag} flag={flag} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {lead.ai_next_action && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/50 text-sm">Recommended Next Action</p>
                        <p className="text-white font-medium mt-1">{lead.ai_next_action}</p>
                      </div>
                      <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors flex items-center gap-2">
                        Take Action
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Scores */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">AI Scores</h3>
                <div className="flex items-center justify-around">
                  <ScoreRing
                    score={lead.ai_quality_score || 0}
                    label="Quality"
                    color="#10B981"
                  />
                  <ScoreRing
                    score={lead.ai_intent_score || 0}
                    label="Intent"
                    color="#3B82F6"
                  />
                  <ScoreRing
                    score={Math.round((lead.ai_confidence || 0) * 100)}
                    label="Confidence"
                    color="#8B5CF6"
                  />
                </div>
              </div>

              {/* Behavioural Analytics */}
              {behavioural && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-6">Behavioural Analytics</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span className="text-white/50 text-sm">Email Opens</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{behavioural.emailOpens}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-purple-400" />
                        <span className="text-white/50 text-sm">Brochure Views</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{behavioural.brochureViews}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Timer className="w-4 h-4 text-amber-400" />
                        <span className="text-white/50 text-sm">Time on Site</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{behavioural.timeOnSite}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MousePointer className="w-4 h-4 text-emerald-400" />
                        <span className="text-white/50 text-sm">Page Views</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{behavioural.pageViews}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-green-400" />
                        <span className="text-white/50 text-sm">Price List</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{behavioural.priceListViews}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="w-4 h-4 text-pink-400" />
                        <span className="text-white/50 text-sm">Floor Plans</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{behavioural.floorPlanViews}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4 text-red-400" />
                        <span className="text-white/50 text-sm">Virtual Tours</span>
                      </div>
                      <p className="text-white text-2xl font-bold">{behavioural.virtualTourViews}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-white/50 text-sm">Last Visit</span>
                      </div>
                      <p className="text-white text-lg font-bold">{behavioural.lastVisit}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Details */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-6">Buyer Details</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Budget</p>
                      <p className="text-white font-medium">{lead.budget || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                      <BedDouble className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Bedrooms</p>
                      <p className="text-white font-medium">{lead.bedrooms || lead.preferred_bedrooms || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Payment Method</p>
                      <p className="text-white font-medium">{lead.payment_method || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Timeline</p>
                      <p className="text-white font-medium">{lead.timeline || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Purpose</p>
                      <p className="text-white font-medium">{lead.purpose || lead.purchase_purpose || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-500/10 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white/50 text-sm">Country</p>
                      <p className="text-white font-medium">{lead.country || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Proceedability */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h4 className="text-white font-medium mb-4">Proceedability</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      {lead.proof_of_funds ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                      )}
                      <span className="text-white/70">Proof of Funds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.uk_broker === 'yes' || lead.uk_broker === 'introduced' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                      )}
                      <span className="text-white/70">UK Broker</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {lead.uk_solicitor === 'yes' || lead.uk_solicitor === 'introduced' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                      )}
                      <span className="text-white/70">UK Solicitor</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Notes & Recommendations */}
              {lead.ai_recommendations && lead.ai_recommendations.length > 0 && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">AI Recommendations</h3>
                  <ul className="space-y-3">
                    {lead.ai_recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-white/70">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">Notes</h3>
                  <p className="text-white/70 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Right Column - Contact & Actions */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {(lead.first_name || lead.full_name || 'U').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{lead.full_name}</p>
                    <p className="text-white/50 text-sm">{lead.country || 'Location unknown'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {lead.email && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <Mail className="w-5 h-5 text-white/40" />
                      <span className="text-white text-sm truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <Phone className="w-5 h-5 text-white/40" />
                      <span className="text-white text-sm">{lead.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors">
                    <Phone className="w-5 h-5" />
                    Call Now
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    WhatsApp
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors">
                    <Mail className="w-5 h-5" />
                    Send Email
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors">
                    <Calendar className="w-5 h-5" />
                    Schedule Viewing
                  </button>
                </div>
              </div>

              {/* Source Info */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Source</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Platform</span>
                    <span className="text-white font-medium">{lead.source_platform || lead.source || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Campaign</span>
                    <span className="text-white font-medium text-right max-w-[60%] truncate">{lead.source_campaign || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Development</span>
                    <span className="text-white font-medium">{lead.development_name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-sm">Current Status</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      lead.status === 'Reserved' || lead.status === 'Exchanged' || lead.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : lead.status === 'Negotiating' || lead.status === 'Viewing Booked'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  {lead.viewing_booked && lead.viewing_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">Viewing Date</span>
                      <span className="text-white font-medium">
                        {new Date(lead.viewing_date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  )}
                  {lead.last_contact && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-sm">Last Contact</span>
                      <span className="text-white font-medium">
                        {new Date(lead.last_contact).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Development Info */}
              {development && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">Development</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-500/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{development.name}</p>
                      <p className="text-white/50 text-sm">{development.location}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">Price Range</span>
                      <span className="text-white">
                        {formatCurrency(parseInt(development.price_from || '0'))} - {formatCurrency(parseInt(development.price_to || '0'))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Available Units</span>
                      <span className="text-white">{development.available_units} of {development.total_units}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
