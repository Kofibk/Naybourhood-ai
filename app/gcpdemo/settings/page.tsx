'use client'

import { CheckCircle2, XCircle, Settings, Shield, Bell, Sliders } from 'lucide-react'

function SettingRow({ label, value, status }: { label: string; value: string; status?: 'active' | 'inactive' | 'pending' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white">{value}</span>
        {status && (
          status === 'active' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : status === 'pending' ? (
            <div className="w-4 h-4 rounded-full border-2 border-amber-400/50 border-t-amber-400 animate-spin" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )
        )}
      </div>
    </div>
  )
}

function ToggleRow({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white/80">{label}</p>
        <p className="text-xs text-white/40">{description}</p>
      </div>
      <div className={`w-10 h-5 rounded-full relative cursor-default ${enabled ? 'bg-emerald-500/30' : 'bg-white/10'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
          enabled ? 'left-5 bg-emerald-400' : 'left-0.5 bg-white/40'
        }`} />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      {/* Client Configuration */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="w-2 h-2 rounded-full bg-[#34D399]" />
          <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">CLIENT CONFIGURATION</span>
        </div>
        <div className="space-y-0">
          <SettingRow label="Client" value="Aroundtown S.A." />
          <SettingRow label="Property" value="London Kensington Serviced Apartments" />
          <SettingRow label="Plan" value="Enterprise" status="active" />
          <SettingRow label="Units" value="70 (60 occupied, 10 available)" />
          <SettingRow label="Demo Login" value="demo@aroundtown.de" />
        </div>
      </div>

      {/* AI Thresholds */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
        <div className="inline-flex items-center gap-3 mb-5">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">AI SCORING THRESHOLDS</span>
        </div>
        <div className="space-y-0">
          <SettingRow label="Priority Threshold" value="Score ≥ 80" />
          <SettingRow label="Qualified Threshold" value="Score ≥ 60" />
          <SettingRow label="Medium Threshold" value="Score ≥ 40" />
          <SettingRow label="Auto-Flag Threshold" value="Score < 40" />
          <SettingRow label="Rent-to-Income Comfort" value="≤ 30%" />
          <SettingRow label="Rent-to-Income Warning" value="30-40%" />
          <SettingRow label="Rent-to-Income High Risk" value="> 40%" />
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
        <div className="inline-flex items-center gap-3 mb-5">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">INTEGRATIONS</span>
        </div>
        <div className="space-y-0">
          <SettingRow label="AML / KYC Verification" value="Connected" status="active" />
          <SettingRow label="Companies House API" value="Connected" status="active" />
          <SettingRow label="Electoral Roll Check" value="Connected" status="active" />
          <SettingRow label="LinkedIn Data Enrichment" value="Connected" status="active" />
          <SettingRow label="Phone / Carrier Lookup" value="Connected" status="active" />
          <SettingRow label="Salary Benchmarking" value="Connected" status="active" />
          <SettingRow label="Property Portal Sync" value="Rightmove, Zoopla" status="active" />
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
        <div className="inline-flex items-center gap-3 mb-5">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">NOTIFICATIONS</span>
        </div>
        <div className="space-y-0">
          <ToggleRow label="New Enquiry Alerts" description="Notify when a new enquiry is received" enabled={true} />
          <ToggleRow label="High-Risk Flags" description="Immediate alert when an applicant is flagged" enabled={true} />
          <ToggleRow label="Verification Complete" description="Notify when tenant verification completes" enabled={true} />
          <ToggleRow label="AI Conversation Complete" description="Alert when AI qualifier finishes a conversation" enabled={true} />
          <ToggleRow label="Pipeline Stage Changes" description="Notify on status transitions" enabled={false} />
          <ToggleRow label="Weekly Summary Report" description="Email digest of pipeline activity" enabled={true} />
        </div>
      </div>
    </div>
  )
}
