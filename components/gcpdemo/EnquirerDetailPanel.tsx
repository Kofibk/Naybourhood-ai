'use client'

import { X, Shield, AlertTriangle, CheckCircle2, XCircle, Clock, MessageSquare, Briefcase, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NBScoreRing } from '@/components/ui/nb-score-ring'
import type { DemoEnquirer, DemoConversation } from '@/lib/gcpdemo/types'
import { getConversationForEnquirer } from '@/lib/gcpdemo'
import Link from 'next/link'

interface EnquirerDetailPanelProps {
  enquirer: DemoEnquirer
  onClose: () => void
}

function ScoreBar({ score, maxScore, color }: { score: number; maxScore: number; color: string }) {
  const pct = (score / maxScore) * 100
  return (
    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function RiskBadge({ level }: { level: string }) {
  const styles = {
    Low: 'bg-emerald-500/20 text-emerald-400',
    Medium: 'bg-amber-500/20 text-amber-400',
    High: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[level as keyof typeof styles] || styles.Medium}`}>
      {level} Risk
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Scored': 'bg-blue-500/20 text-blue-400',
    'Viewing Booked': 'bg-cyan-500/20 text-cyan-400',
    'Viewing Complete': 'bg-teal-500/20 text-teal-400',
    'Verification In Progress': 'bg-amber-500/20 text-amber-400',
    'Verified': 'bg-emerald-500/20 text-emerald-400',
    'Tenancy Signed': 'bg-emerald-500/20 text-emerald-300',
    'Flagged': 'bg-red-500/20 text-red-400',
    'Fell Through': 'bg-gray-500/20 text-gray-400',
    'Archived': 'bg-gray-600/20 text-gray-500',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  )
}

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
    'Verified': { icon: CheckCircle2, cls: 'text-emerald-400', label: 'Verified' },
    'Verifying': { icon: Clock, cls: 'text-amber-400', label: 'Verifying' },
    'Failed': { icon: XCircle, cls: 'text-red-400', label: 'Failed' },
    'Not Started': { icon: Shield, cls: 'text-white/40', label: 'Not Verified' },
  }
  const { icon: Icon, cls, label } = map[status] || map['Not Started']
  return (
    <div className={`flex items-center gap-1.5 ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

export function EnquirerDetailPanel({ enquirer, onClose }: EnquirerDetailPanelProps) {
  const conversation = getConversationForEnquirer(enquirer.id)
  const rentPCM = enquirer.linkedUnit
    ? [1850, 2200, 3100, 1900, 2350, 3250, 2150, 1800, 3400, 2100][
        ['1A', '2C', '3B', '4A', '5D', '6B', '7A', '8C', '9B', '10A'].indexOf(enquirer.linkedUnit)
      ] || 2000
    : 2000
  const rentRatio = enquirer.annualIncome > 0 ? ((rentPCM * 12) / enquirer.annualIncome * 100).toFixed(1) : 'N/A'

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#0A0A0A] border-l border-white/10 z-50 overflow-y-auto shadow-2xl">
      {/* Close */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Enquirer Detail</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 1. Header */}
        <div>
          <h3 className="text-xl font-semibold text-white">{enquirer.fullName}</h3>
          <p className="text-sm text-white/60 mt-1">{enquirer.role} · {enquirer.employer}</p>
          {enquirer.linkedUnit && (
            <p className="text-xs text-emerald-400 mt-1">Unit {enquirer.linkedUnit} · {enquirer.area}</p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-white/40">
            <Mail className="w-3 h-3" /> {enquirer.email}
            <span className="mx-1">·</span>
            <Phone className="w-3 h-3" /> {enquirer.phone}
          </div>
        </div>

        {/* 2. Score Overview */}
        <div className="flex items-center gap-6 p-4 bg-[#111111] rounded-xl border border-white/10">
          <NBScoreRing score={enquirer.aiScore} size={72} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={enquirer.pipelineStatus} />
              <RiskBadge level={enquirer.riskLevel} />
              <VerificationBadge status={enquirer.verificationStatus} />
            </div>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <span>Intent: <strong className="text-white">{enquirer.intentScore}</strong></span>
              <span>Quality: <strong className="text-white">{enquirer.aiScore}</strong></span>
            </div>
          </div>
        </div>

        {/* 3. Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111111] rounded-lg p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Annual Income</p>
            <p className="text-lg font-semibold text-white mt-0.5">£{enquirer.annualIncome.toLocaleString()}</p>
          </div>
          <div className="bg-[#111111] rounded-lg p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Rent PCM</p>
            <p className="text-lg font-semibold text-white mt-0.5">£{rentPCM.toLocaleString()}</p>
          </div>
          <div className="bg-[#111111] rounded-lg p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Rent-to-Income</p>
            <p className={`text-lg font-semibold mt-0.5 ${
              parseFloat(String(rentRatio)) <= 30 ? 'text-emerald-400' :
              parseFloat(String(rentRatio)) <= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>{rentRatio}%</p>
          </div>
          <div className="bg-[#111111] rounded-lg p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Days in Pipeline</p>
            <p className="text-lg font-semibold text-white mt-0.5">{enquirer.daysInPipeline}</p>
          </div>
        </div>

        {/* 5. Tenant Summary */}
        {enquirer.tenantSummary && (
          <div>
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">TENANT SUMMARY</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{enquirer.tenantSummary}</p>
          </div>
        )}

        {/* 6. Quality Score Breakdown */}
        {enquirer.qualityBreakdown && (
          <div>
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">QUALITY SCORE BREAKDOWN</span>
            </div>
            <div className="space-y-4">
              {enquirer.qualityBreakdown.map((factor) => (
                <div key={factor.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/80">{factor.name}</span>
                    <span className="text-xs font-medium text-white/60">{factor.score}/{factor.maxScore}</span>
                  </div>
                  <ScoreBar
                    score={factor.score}
                    maxScore={factor.maxScore}
                    color={factor.score / factor.maxScore >= 0.7 ? 'bg-emerald-500' : factor.score / factor.maxScore >= 0.45 ? 'bg-amber-500' : 'bg-red-500'}
                  />
                  <p className="text-xs text-white/40 mt-1">{factor.evidence}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Intent Score */}
        {enquirer.intentTimeline && (
          <div>
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
                INTENT SCORE — {enquirer.intentScore}/100
              </span>
            </div>
            <div className="space-y-2">
              {enquirer.intentTimeline.map((event, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    event.type === 'positive' ? 'bg-emerald-400' :
                    event.type === 'negative' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div>
                    <p className="text-sm text-white/70">{event.event}</p>
                    <p className="text-[10px] text-white/30">{new Date(event.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. Consistency Checks */}
        {enquirer.consistencyChecks && (
          <div>
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">CONSISTENCY CHECKS</span>
            </div>
            <div className="space-y-2">
              {enquirer.consistencyChecks.map((check, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#111111] border border-white/5">
                  {check.result === 'Match' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  ) : check.result === 'Mismatch' ? (
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/80">{check.field}</span>
                      <span className={`text-[10px] font-medium ${
                        check.result === 'Match' ? 'text-emerald-400' :
                        check.result === 'Mismatch' ? 'text-red-400' : 'text-amber-400'
                      }`}>{check.result}</span>
                    </div>
                    <p className="text-[11px] text-white/40 mt-0.5">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. AI Conversation Preview */}
        {conversation && (
          <div>
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#34D399]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">AI CONVERSATION</span>
            </div>
            <div className="bg-[#111111] rounded-xl border border-white/5 p-4">
              <div className="space-y-2">
                {conversation.messages.slice(0, 3).map((msg) => (
                  <div key={msg.id} className={`text-xs ${msg.sender === 'ai' ? 'text-blue-300/70' : 'text-white/60'}`}>
                    <span className="font-medium">{msg.sender === 'ai' ? 'AI' : enquirer.firstName}:</span> {msg.content.slice(0, 100)}...
                  </div>
                ))}
              </div>
              <Link
                href={`/gcpdemo/conversations?id=${conversation.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 mt-3 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                View Full Conversation ({conversation.messages.length} messages)
              </Link>
            </div>
            {/* Outcome Assessment */}
            <div className="mt-3 bg-[#111111] rounded-xl border border-white/5 p-4">
              <p className="text-xs font-medium text-white/50 mb-2">Outcome Assessment — Score {conversation.outcome.score} ({conversation.outcome.category})</p>
              <div className="space-y-1.5">
                {conversation.outcome.lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {line.status === 'pass' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    ) : line.status === 'warn' ? (
                      <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    )}
                    <span className="text-xs text-white/60">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 10. Pipeline Timeline */}
        <div>
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">PIPELINE TIMELINE</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            <span>{enquirer.daysInPipeline} days since enquiry</span>
            <span className="mx-1">·</span>
            <span>Current: {enquirer.pipelineStatus}</span>
          </div>
        </div>

        {/* 11. Action Buttons */}
        <div className="flex gap-3 pt-2 pb-4">
          {enquirer.verificationStatus === 'Not Started' && (
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1">
              <Shield className="w-4 h-4 mr-2" />
              Verify Tenant
            </Button>
          )}
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 flex-1">
            <Briefcase className="w-4 h-4 mr-2" />
            Book Viewing
          </Button>
        </div>
      </div>
    </div>
  )
}
