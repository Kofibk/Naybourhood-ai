'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useCampaigns } from '@/hooks/useCampaigns'
import { useDevelopments } from '@/hooks/useDevelopments'
import { useUsers } from '@/hooks/useUsers'
import { useLeads } from '@/hooks/useLeads'
import { useCompanies } from '@/hooks/useCompanies'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { LeadImporter } from '@/components/admin/LeadImporter'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'
import type { UserRole, JobRole } from '@/types'
import {
  Bell,
  User,
  Save,
  CheckCircle,
  AlertCircle,
  Building2,
  Bot,
  Flame,
  Clock,
  Zap,
  Users,
  Plus,
  X,
  XCircle,
  Mail,
  UserCircle,
  Shield,
  Send,
  Briefcase,
  Database,
  Key,
  Link,
  Globe,
  RefreshCw,
  BarChart2,
  MessageSquare,
  ExternalLink,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

type SettingsUserType = 'admin' | 'developer' | 'agent' | 'broker'

interface SettingsPageProps {
  userType: SettingsUserType
}

// --- Admin-specific sections ---

function AdminSystemStats() {
  const { leads, isLoading: leadsLoading } = useLeads()
  const { companies } = useCompanies()
  const { campaigns, refreshCampaigns } = useCampaigns()
  const { developments } = useDevelopments()
  const isLoading = leadsLoading

  const systemStats = useMemo(() => {
    const activeLeads = leads.filter(l => l.status !== 'Disqualified')
    const disqualifiedCount = leads.length - activeLeads.length
    return {
      totalLeads: activeLeads.length,
      disqualifiedLeads: disqualifiedCount,
      totalCampaigns: campaigns.length,
      totalCompanies: companies.length,
      totalDevelopments: developments.length,
      dataSource: 'Supabase',
    }
  }, [leads, campaigns, companies, developments])

  const integrations = [
    {
      name: 'Supabase',
      description: 'Database, Auth & Realtime',
      icon: Database,
      status: 'connected',
      configUrl: 'https://supabase.com/dashboard',
    },
    {
      name: 'Stripe',
      description: 'Payment processing',
      icon: Key,
      status: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'connected' : 'not_configured',
      configUrl: 'https://dashboard.stripe.com',
    },
    {
      name: 'WhatsApp',
      description: 'Business messaging',
      icon: MessageSquare,
      status: 'not_configured',
      configUrl: 'https://business.facebook.com/latest/whatsapp_manager',
    },
    {
      name: 'SendGrid',
      description: 'Email delivery',
      icon: Mail,
      status: 'not_configured',
      configUrl: 'https://app.sendgrid.com',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Connected
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Not Configured
          </Badge>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Header with data source badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Settings</h2>
          <p className="text-sm text-muted-foreground">
            View platform configuration and integration status
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Database className="h-3 w-3" />
          {systemStats.dataSource}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Leads</span>
            </div>
            <p className="text-2xl font-bold">{systemStats.totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Campaigns</span>
            </div>
            <p className="text-2xl font-bold">{systemStats.totalCampaigns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Companies</span>
            </div>
            <p className="text-2xl font-bold">{systemStats.totalCompanies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Developments</span>
            </div>
            <p className="text-2xl font-bold">{systemStats.totalDevelopments}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Import */}
      <LeadImporter />

      {/* Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Connected Services
          </CardTitle>
          <CardDescription>
            Integration status for third-party services. Configure these in their respective dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex items-center justify-between p-4 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <integration.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{integration.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {integration.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(integration.status)}
                <a
                  href={integration.configUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Data Synchronization
          </CardTitle>
          <CardDescription>Real-time data sync is enabled via Supabase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <div className="font-medium">Real-time sync</div>
              <div className="text-sm text-muted-foreground">
                Data updates automatically when changes occur
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <button
            onClick={() => refreshCampaigns()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data Now
          </button>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
          <CardDescription>Authentication is managed via Supabase Auth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <div className="font-medium">Magic Link Authentication</div>
              <div className="text-sm text-muted-foreground">
                Passwordless login via email
              </div>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <div className="font-medium">Row Level Security</div>
              <div className="text-sm text-muted-foreground">
                Data access controlled at database level
              </div>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Platform Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Platform Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Platform</p>
              <p className="font-medium">Naybourhood</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Framework</p>
              <p className="font-medium">Next.js 14</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Database</p>
              <p className="font-medium">Supabase PostgreSQL</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm text-muted-foreground">Hosting</p>
              <p className="font-medium">Vercel</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// --- Shared AI Notifications card (used by all roles) ---

function AINotificationsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Notifications & Tasks
        </CardTitle>
        <CardDescription>AI-powered alerts and automated task suggestions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Flame className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="font-medium">Hot Lead Alerts</div>
              <div className="text-sm text-muted-foreground">Get notified when AI identifies high-intent leads</div>
            </div>
          </div>
          <Button variant="outline" size="sm">Enabled</Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="font-medium">Follow-up Reminders</div>
              <div className="text-sm text-muted-foreground">AI-suggested follow-up times based on lead activity</div>
            </div>
          </div>
          <Button variant="outline" size="sm">Enabled</Button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <div className="font-medium">Priority Actions</div>
              <div className="text-sm text-muted-foreground">AI-recommended next steps for each lead</div>
            </div>
          </div>
          <Button variant="outline" size="sm">Enabled</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Client settings sections (developer/agent/broker) ---

function ClientSettings({ userType }: { userType: 'developer' | 'agent' | 'broker' }) {
  const { user, refreshUser } = useAuth()
  const { users, refreshUsers } = useUsers()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editedName, setEditedName] = useState('')
  const [companyData, setCompanyData] = useState<{
    id?: string
    name?: string
    subscription_tier?: string
    subscription_status?: string
  } | null>(null)

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: userType as UserRole,
    job_role: 'sales' as JobRole,
  })
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  // Get team members from same company
  const teamMembers = useMemo(() => {
    if (!user?.company_id) return []
    return users.filter(u => u.company_id === user.company_id)
  }, [users, user?.company_id])

  useEffect(() => {
    setEditedName(user?.name || '')

    const fetchCompanyData = async () => {
      if (!user?.id || !isSupabaseConfigured()) {
        if (user?.company) {
          setCompanyData({ name: user.company, id: user.company_id })
        }
        return
      }

      const supabase = createClient()
      let companyId = user.company_id
      let companyNameFromProfile: string | undefined

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id, company_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        companyId = companyId || profile.company_id
        companyNameFromProfile = profile.company_name
      }

      if (companyId) {
        const { data } = await supabase
          .from('companies')
          .select('id, name, subscription_tier, subscription_status')
          .eq('id', companyId)
          .single()

        if (data) {
          setCompanyData(data)
          return
        }
      }

      const fallbackName = companyNameFromProfile || user.company
      if (fallbackName) {
        setCompanyData({ name: fallbackName, id: companyId })
      }
    }

    fetchCompanyData()
  }, [user])

  const handleSave = async () => {
    if (!user?.id || !isSupabaseConfigured()) {
      setMessage({ type: 'error', text: 'Unable to save changes.' })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const nameParts = editedName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const { error } = await supabase
        .from('user_profiles')
        .update({ first_name: firstName, last_name: lastName, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        setMessage({ type: 'error', text: 'Failed to update profile.' })
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setIsEditing(false)
        await refreshUser()
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendInvite = async () => {
    if (!inviteData.email || !inviteData.name) {
      setMessage({ type: 'error', text: 'Name and email are required' })
      return
    }

    const companyId = companyData?.id || user?.company_id
    if (!companyId) {
      setMessage({ type: 'error', text: 'No company associated with your account' })
      return
    }

    setIsSendingInvite(true)
    setMessage(null)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteData.email,
          name: inviteData.name,
          role: inviteData.role,
          job_role: inviteData.job_role,
          company_id: companyId,
          is_internal: false,
          inviter_role: user?.role,
          inviter_company_id: companyId,
          inviter_email: user?.email,
          is_master_admin: user?.is_master_admin,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success('Invitation Sent!', {
        description: `An invitation email has been sent to ${inviteData.email}. They will appear as "Pending" until they accept.`,
        duration: 5000,
      })

      setMessage({
        type: 'success',
        text: `Invitation sent to ${inviteData.email}!`
      })
      setIsInviteModalOpen(false)
      setInviteData({ name: '', email: '', role: userType, job_role: 'sales' })
      refreshUsers()
    } catch (e) {
      toast.error('Failed to Send Invitation', {
        description: e instanceof Error ? e.message : 'An error occurred while sending the invitation',
        duration: 5000,
      })

      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to send invitation'
      })
    } finally {
      setIsSendingInvite(false)
    }
  }

  const getTierDisplayName = (tier?: string) => {
    switch (tier) {
      case 'starter': return 'Starter'
      case 'access': return 'Access'
      case 'growth': return 'Growth'
      case 'enterprise': return 'Enterprise'
      default: return 'Free'
    }
  }

  const getTierPrice = (tier?: string) => {
    switch (tier) {
      case 'starter': return '£299'
      case 'access': return '£499'
      case 'growth': return '£899'
      case 'enterprise': return 'Custom'
      default: return '£0'
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-purple-600">Admin</Badge>
      case 'developer':
        return <Badge variant="default" className="bg-blue-600">Developer</Badge>
      case 'agent':
        return <Badge variant="outline">Agent</Badge>
      case 'broker':
        return <Badge variant="secondary">Broker</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // Role options ordered with current userType first, then agent, then others
  const otherRoles = userType === 'broker'
    ? ['agent', 'developer'] as const
    : (['developer', 'agent', 'broker'] as const).filter(r => r !== userType)
  const roleOptions = [userType, ...otherRoles]

  // Notification label varies slightly by role
  const leadAlertLabel = userType === 'broker' ? 'New Lead Alerts' : 'New Buyer Alerts'
  const leadAlertDescription = userType === 'broker'
    ? 'Get notified of new assigned leads'
    : 'Get notified when new buyers match your criteria'

  return (
    <>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-display">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{message.text}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => setMessage(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={isEditing ? editedName : (user?.name || '')}
                onChange={(e) => setEditedName(e.target.value)}
                readOnly={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email || ''} readOnly className="bg-muted" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{user?.role || userType}</Badge>
            {user?.company && (
              <Badge variant="secondary">{user.company}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false)
                  setEditedName(user?.name || '')
                }}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team & Invites */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team & Invites
              </CardTitle>
              <CardDescription>Invite team members to your company</CardDescription>
            </div>
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{member.name}</div>
                      <div className="text-xs text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(member.role)}
                    {member.status === 'pending' && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm">Invite colleagues to collaborate</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company & Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company & Subscription
          </CardTitle>
          <CardDescription>Your organisation&apos;s plan</CardDescription>
        </CardHeader>
        <CardContent>
          {companyData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <div className="font-semibold">{companyData.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{getTierDisplayName(companyData.subscription_tier)}</Badge>
                    <Badge variant={companyData.subscription_status === 'active' ? 'success' : 'secondary'}>
                      {companyData.subscription_status || 'active'}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{getTierPrice(companyData.subscription_tier)}</div>
                  <div className="text-sm text-muted-foreground">/month</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">No company subscription found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{leadAlertLabel}</div>
              <div className="text-sm text-muted-foreground">
                {leadAlertDescription}
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Message Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive alerts for new messages
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Notifications */}
      <AINotificationsCard />

      {/* API Keys */}
      <ApiKeysManager />

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Invite Team Member
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Invite a colleague to join {companyData?.name || 'your company'} on Naybourhood.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="colleague@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Full Name *
                </label>
                <Input
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    User Type
                  </label>
                  <select
                    value={inviteData.role}
                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as UserRole })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {roleOptions.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Role
                  </label>
                  <select
                    value={inviteData.job_role}
                    onChange={(e) => setInviteData({ ...inviteData, job_role: e.target.value as JobRole })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="operations">Operations</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={isSendingInvite || !inviteData.email || !inviteData.name}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSendingInvite ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// --- Main export ---

export function SettingsPage({ userType }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      {userType === 'admin' ? (
        <>
          <AdminSystemStats />
          <AINotificationsCard />
          <ApiKeysManager />
        </>
      ) : (
        <ClientSettings userType={userType} />
      )}
    </div>
  )
}
