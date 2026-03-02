'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SB_DEMO_USER, SB_DEMO_COMPANY } from '@/lib/demo-data-smartbricks'
import { User, Building2, Bell, Shield, Key, Users, Plug } from 'lucide-react'

export default function SBDemoSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-sm text-white/50">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-400" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <span className="text-2xl font-semibold text-emerald-400">S</span>
            </div>
            <div>
              <p className="text-lg font-medium text-white">{SB_DEMO_USER.name}</p>
              <p className="text-sm text-white/50">{SB_DEMO_USER.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success">Head of Sales</Badge>
                <Badge variant="secondary">{SB_DEMO_COMPANY.name}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Scott McGeachy', email: 'scott@smartbricks.com', role: 'Head of Sales', status: 'Active' },
              { name: 'Ali Ramji', email: 'ali@smartbricks.com', role: 'Off-Plan Director', status: 'Active' },
            ].map((member) => (
              <div key={member.email} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/70">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-white">{member.name}</p>
                    <p className="text-xs text-white/40">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{member.role}</Badge>
                  <Badge variant={member.status === 'Active' ? 'success' : 'warning'} className="text-[10px]">{member.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4 border-white/10 text-white/70 hover:bg-white/5">
            <Users className="h-3.5 w-3.5 mr-2" />
            Invite Team Member
          </Button>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plug className="h-5 w-5 text-indigo-400" />
            Integrations
          </CardTitle>
          <p className="text-sm text-white/40 mt-1">Connect your tools and platforms</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Bayut', bg: 'bg-[#E42527]/15', text: 'text-[#E42527]', initials: 'By' },
              { name: 'Property Finder', bg: 'bg-[#00B2A9]/15', text: 'text-[#00B2A9]', initials: 'PF' },
              { name: 'Dubizzle', bg: 'bg-[#BB1E10]/15', text: 'text-[#BB1E10]', initials: 'Dz' },
              { name: 'WhatsApp', bg: 'bg-[#25D366]/15', text: 'text-[#25D366]', initials: 'WA' },
              { name: 'Facebook', bg: 'bg-[#1877F2]/15', text: 'text-[#1877F2]', initials: 'Fb' },
              { name: 'Salesforce', bg: 'bg-[#00A1E0]/15', text: 'text-[#00A1E0]', initials: 'SF' },
              { name: 'HubSpot', bg: 'bg-[#FF7A59]/15', text: 'text-[#FF7A59]', initials: 'HS' },
              { name: 'Gmail', bg: 'bg-[#EA4335]/15', text: 'text-[#EA4335]', initials: 'Gm' },
              { name: 'Outlook', bg: 'bg-[#0078D4]/15', text: 'text-[#0078D4]', initials: 'Ol' },
            ].map((integration) => (
              <div
                key={integration.name}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
              >
                <div className={`h-10 w-10 rounded-lg ${integration.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-xs font-bold ${integration.text}`}>{integration.initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{integration.name}</p>
                  <p className="text-[10px] text-white/40">Coming soon</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Company & Subscription */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            Company & Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Company</span>
            <span className="text-sm font-medium text-white">{SB_DEMO_COMPANY.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Plan</span>
            <Badge variant="success">Enterprise - Custom</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Status</span>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Next billing</span>
            <span className="text-sm text-white/70">1 April 2026</span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'New buyer alerts', enabled: true },
            { label: 'Hot lead notifications', enabled: true },
            { label: 'Campaign performance alerts', enabled: true },
            { label: 'Follow-up reminders', enabled: true },
            { label: 'Weekly summary email', enabled: false },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between py-1">
              <span className="text-sm text-white/70">{n.label}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${n.enabled ? 'bg-emerald-500' : 'bg-white/20'}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Authentication</span>
            <Badge variant="success">Magic Link + SSO</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">Row Level Security</span>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/50">KYC Verification</span>
            <Badge variant="success">Verified</Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="bg-[#111111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key className="h-5 w-5 text-cyan-400" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white">Production Key</p>
              <p className="text-xs text-white/40 font-mono">nb_live_****...****9b2e</p>
            </div>
            <Badge variant="success" className="text-[10px]">Active</Badge>
          </div>
          <Button variant="outline" size="sm" className="mt-3 border-white/10 text-white/70 hover:bg-white/5">
            Generate New Key
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
