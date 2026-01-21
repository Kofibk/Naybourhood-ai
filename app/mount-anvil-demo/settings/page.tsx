'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMountAnvilDemo } from '@/contexts/MountAnvilDemoContext'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Building2,
  Settings,
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Zap,
  CreditCard,
  Mail,
  MessageSquare,
  Phone,
  ChevronRight,
  Check,
  ExternalLink,
  Shield,
  Database,
  Key,
  Webhook,
  RefreshCw,
  Edit,
  Home,
  Calendar,
} from 'lucide-react'

// Integration card component
function IntegrationCard({
  name,
  description,
  icon: Icon,
  connected,
  color,
}: {
  name: string
  description: string
  icon: React.ElementType
  connected: boolean
  color: string
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">{name}</p>
            <p className="text-white/50 text-sm">{description}</p>
          </div>
        </div>
        <button
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            connected
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
          }`}
        >
          {connected ? (
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" />
              Connected
            </span>
          ) : (
            'Connect'
          )}
        </button>
      </div>
    </div>
  )
}

// Toggle switch component
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-white/20'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { user, isLoading } = useMountAnvilDemo()

  // Settings states
  const [activeTab, setActiveTab] = useState('profile')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [hotLeadAlerts, setHotLeadAlerts] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [autoScore, setAutoScore] = useState(true)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'api', label: 'API & Webhooks', icon: Webhook },
  ]

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
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
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
          <Link
            href="/mount-anvil-demo/developments"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Building2 className="w-5 h-5" />
            Developments
          </Link>
          <Link
            href="/mount-anvil-demo/settings"
            className="flex items-center gap-3 px-4 py-3 text-white bg-white/5 rounded-xl"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-medium">
              {user.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user.firstName}</p>
              <p className="text-white/40 text-xs">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div>
            <h2 className="text-white text-2xl font-bold">Settings</h2>
            <p className="text-white/50 text-sm mt-1">
              Manage your account and preferences
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <div className="flex gap-8">
            {/* Settings Tabs */}
            <div className="w-56 flex-shrink-0">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Settings Content */}
            <div className="flex-1 max-w-3xl">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-6">Profile Information</h3>

                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">{user.firstName.charAt(0)}</span>
                      </div>
                      <div>
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">
                          Change Avatar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/50 text-sm mb-2">First Name</label>
                        <input
                          type="text"
                          value={user.firstName}
                          readOnly
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-white/50 text-sm mb-2">Last Name</label>
                        <input
                          type="text"
                          value={user.lastName}
                          readOnly
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-white/50 text-sm mb-2">Email</label>
                        <input
                          type="email"
                          value={user.email}
                          readOnly
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-white/50 text-sm mb-2">Role</label>
                        <input
                          type="text"
                          value={user.role}
                          readOnly
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10">
                      <button className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">Company</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold">MA</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">Mount Anvil</p>
                        <p className="text-white/50 text-sm">Property Developer</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-6">Notification Preferences</h3>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Email Notifications</p>
                          <p className="text-white/50 text-sm">Receive updates via email</p>
                        </div>
                      </div>
                      <Toggle enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <Bell className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Push Notifications</p>
                          <p className="text-white/50 text-sm">Browser push notifications</p>
                        </div>
                      </div>
                      <Toggle enabled={pushNotifications} onChange={() => setPushNotifications(!pushNotifications)} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                          <Zap className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Hot Lead Alerts</p>
                          <p className="text-white/50 text-sm">Instant alerts for high-intent leads</p>
                        </div>
                      </div>
                      <Toggle enabled={hotLeadAlerts} onChange={() => setHotLeadAlerts(!hotLeadAlerts)} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">Weekly Reports</p>
                          <p className="text-white/50 text-sm">Performance summary every Monday</p>
                        </div>
                      </div>
                      <Toggle enabled={weeklyReports} onChange={() => setWeeklyReports(!weeklyReports)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-2">Advertising Platforms</h3>
                    <p className="text-white/50 text-sm mb-6">Connect your ad accounts to sync campaign data</p>

                    <div className="space-y-4">
                      <IntegrationCard
                        name="Meta Ads"
                        description="Facebook & Instagram advertising"
                        icon={Globe}
                        connected={true}
                        color="bg-blue-600"
                      />
                      <IntegrationCard
                        name="Google Ads"
                        description="Search and display advertising"
                        icon={Globe}
                        connected={true}
                        color="bg-red-500"
                      />
                      <IntegrationCard
                        name="LinkedIn Ads"
                        description="Professional network advertising"
                        icon={Globe}
                        connected={true}
                        color="bg-sky-600"
                      />
                      <IntegrationCard
                        name="TikTok Ads"
                        description="Short-form video advertising"
                        icon={Globe}
                        connected={false}
                        color="bg-pink-500"
                      />
                    </div>
                  </div>

                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-2">Communication</h3>
                    <p className="text-white/50 text-sm mb-6">Connect messaging and email platforms</p>

                    <div className="space-y-4">
                      <IntegrationCard
                        name="WhatsApp Business"
                        description="Send messages and templates"
                        icon={MessageSquare}
                        connected={true}
                        color="bg-green-600"
                      />
                      <IntegrationCard
                        name="Mailchimp"
                        description="Email marketing automation"
                        icon={Mail}
                        connected={false}
                        color="bg-amber-500"
                      />
                      <IntegrationCard
                        name="Twilio"
                        description="SMS and voice communications"
                        icon={Phone}
                        connected={false}
                        color="bg-red-600"
                      />
                    </div>
                  </div>

                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-2">CRM & Property Portals</h3>
                    <p className="text-white/50 text-sm mb-6">Sync with property listing platforms</p>

                    <div className="space-y-4">
                      <IntegrationCard
                        name="Salesforce"
                        description="CRM synchronisation"
                        icon={Database}
                        connected={false}
                        color="bg-blue-500"
                      />
                      <IntegrationCard
                        name="Rightmove"
                        description="Property portal leads"
                        icon={Home}
                        connected={true}
                        color="bg-emerald-600"
                      />
                      <IntegrationCard
                        name="Zoopla"
                        description="Property portal leads"
                        icon={Home}
                        connected={true}
                        color="bg-purple-600"
                      />
                      <IntegrationCard
                        name="Juwai"
                        description="Chinese property portal"
                        icon={Globe}
                        connected={true}
                        color="bg-red-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-6">Security Settings</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-white/60" />
                          <div>
                            <p className="text-white font-medium">Password</p>
                            <p className="text-white/50 text-sm">Last changed 30 days ago</p>
                          </div>
                        </div>
                        <button className="text-emerald-400 text-sm font-medium hover:underline">
                          Change
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-white/60" />
                          <div>
                            <p className="text-white font-medium">Two-Factor Authentication</p>
                            <p className="text-white/50 text-sm">Add extra security to your account</p>
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-emerald-500 text-white text-sm font-medium rounded-lg">
                          Enable
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Key className="w-5 h-5 text-white/60" />
                          <div>
                            <p className="text-white font-medium">Active Sessions</p>
                            <p className="text-white/50 text-sm">2 devices currently logged in</p>
                          </div>
                        </div>
                        <button className="text-red-400 text-sm font-medium hover:underline">
                          Manage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-white font-semibold">Current Plan</h3>
                        <p className="text-white/50 text-sm">Your subscription details</p>
                      </div>
                      <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl font-semibold">
                        Enterprise
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/50 text-sm">Leads/month</p>
                        <p className="text-white text-2xl font-bold">Unlimited</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/50 text-sm">Users</p>
                        <p className="text-white text-2xl font-bold">25</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4">
                        <p className="text-white/50 text-sm">Developments</p>
                        <p className="text-white text-2xl font-bold">Unlimited</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div>
                        <p className="text-white font-medium">Next billing date</p>
                        <p className="text-white/50 text-sm">February 1, 2026</p>
                      </div>
                      <button className="text-emerald-400 font-medium hover:underline flex items-center gap-1">
                        Manage Subscription <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-4">Payment Method</h3>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">VISA</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">Visa ending in 4242</p>
                          <p className="text-white/50 text-sm">Expires 12/2027</p>
                        </div>
                      </div>
                      <button className="text-white/60 hover:text-white">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* API Tab */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-2">API Keys</h3>
                    <p className="text-white/50 text-sm mb-6">Manage your API credentials</p>

                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">Production Key</p>
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-white/60 text-sm font-mono">
                            nb_live_****************************k7Yx
                          </code>
                          <button className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg">
                            Copy
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">Test Key</p>
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">Test Mode</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-white/60 text-sm font-mono">
                            nb_test_****************************m3Qa
                          </code>
                          <button className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg">
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>

                    <button className="mt-4 text-emerald-400 text-sm font-medium hover:underline">
                      + Generate New Key
                    </button>
                  </div>

                  <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-semibold mb-2">Webhooks</h3>
                    <p className="text-white/50 text-sm mb-6">Receive real-time updates</p>

                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Lead Created</p>
                            <code className="text-white/50 text-sm">https://api.mountanvil.com/webhooks/leads</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                            <span className="text-emerald-400 text-sm">Active</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">Lead Scored</p>
                            <code className="text-white/50 text-sm">https://api.mountanvil.com/webhooks/scores</code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                            <span className="text-emerald-400 text-sm">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button className="mt-4 text-emerald-400 text-sm font-medium hover:underline">
                      + Add Webhook
                    </button>
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
