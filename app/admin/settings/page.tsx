'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useData } from '@/contexts/DataContext'
import { LeadImporter } from '@/components/admin/LeadImporter'
import {
  Database,
  Key,
  Link,
  Mail,
  Shield,
  Settings,
  Users,
  Building2,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart2,
  MessageSquare,
  ExternalLink,
  Bot,
  Bell,
  Zap,
  Clock,
  Flame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { isLoading, leads, campaigns, companies, developments, refreshData } = useData()

  // System stats - excluding disqualified from lead count
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
    <div className="space-y-6">
      {/* Header */}
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

      {/* AI Notifications & Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Notifications & Tasks
          </CardTitle>
          <CardDescription>Configure AI-powered alerts and automated task suggestions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="font-medium">Hot Lead Alerts</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when AI identifies high-intent leads
                </div>
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
                <div className="text-sm text-muted-foreground">
                  AI-suggested follow-up times based on lead activity
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">Enabled</Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="font-medium">Daily AI Digest</div>
                <div className="text-sm text-muted-foreground">
                  Morning summary of leads, trends and recommended actions
                </div>
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
                <div className="text-sm text-muted-foreground">
                  AI-recommended next steps for each lead
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">Enabled</Button>
          </div>
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
            onClick={() => refreshData()}
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
    </div>
  )
}
