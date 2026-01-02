'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/contexts/DataContext'
import {
  Bell,
  Database,
  Key,
  Link,
  Mail,
  Shield,
  Webhook,
  Settings,
  Palette,
  Users,
  Building2,
  Target,
  Zap,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Save,
  Copy,
  Eye,
  EyeOff,
  Sliders,
  BarChart2,
  MessageSquare,
} from 'lucide-react'

export default function SettingsPage() {
  const { isLoading, isSupabase, isAirtable, leads, campaigns, companies, developments } = useData()
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'scoring' | 'notifications' | 'api'>('general')
  const [showApiKey, setShowApiKey] = useState(false)

  // System stats
  const systemStats = useMemo(() => {
    return {
      totalLeads: leads.length,
      totalCampaigns: campaigns.length,
      totalCompanies: companies.length,
      totalDevelopments: developments.length,
      dataSource: isAirtable ? 'Airtable' : isSupabase ? 'Supabase' : 'Demo Data',
    }
  }, [leads, campaigns, companies, developments, isAirtable, isSupabase])

  // Lead scoring thresholds (would be saved to database)
  const [scoringConfig, setScoringConfig] = useState({
    hotThreshold: 80,
    warmThreshold: 60,
    coldThreshold: 0,
    weightBudget: 25,
    weightTimeline: 20,
    weightMortgage: 20,
    weightLocation: 15,
    weightEngagement: 20,
  })

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'scoring', label: 'Lead Scoring', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API & Security', icon: Shield },
  ]

  const integrations = [
    {
      name: 'Supabase',
      description: 'Database, Auth & Realtime',
      icon: Database,
      status: isSupabase ? 'connected' : 'disconnected',
      env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    },
    {
      name: 'Airtable',
      description: 'Alternative database',
      icon: Database,
      status: isAirtable ? 'connected' : 'disconnected',
      env: ['NEXT_PUBLIC_AIRTABLE_API_KEY', 'NEXT_PUBLIC_AIRTABLE_BASE_ID'],
    },
    {
      name: 'Stripe',
      description: 'Payment processing',
      icon: Key,
      status: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'connected' : 'disconnected',
      env: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
    },
    {
      name: 'WhatsApp',
      description: 'Business messaging',
      icon: MessageSquare,
      status: 'disconnected',
      env: ['WHATSAPP_API_KEY', 'WHATSAPP_PHONE_ID'],
    },
    {
      name: 'SendGrid',
      description: 'Email delivery',
      icon: Mail,
      status: 'disconnected',
      env: ['SENDGRID_API_KEY'],
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
            Not Connected
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
            Configure platform settings and integrations
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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Platform Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Platform Branding
              </CardTitle>
              <CardDescription>Customize your platform appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform Name</label>
                  <Input defaultValue="Naybourhood" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Support Email</label>
                  <Input defaultValue="support@naybourhood.ai" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform Description</label>
                <Textarea
                  defaultValue="AI-powered lead generation and management for property developers"
                  rows={2}
                />
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Admin Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input defaultValue="Kofi" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input defaultValue="admin@naybourhood.ai" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Input value="Super Admin" disabled />
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Update Profile
              </Button>
            </CardContent>
          </Card>

          {/* Default Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Default Settings
              </CardTitle>
              <CardDescription>Default values for new records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Lead Status</label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Default Campaign Status</label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Format</label>
                  <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Defaults
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
              <CardDescription>Manage your third-party integrations</CardDescription>
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
                  <div className="flex items-center gap-2">
                    {getStatusBadge(integration.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      className={integration.status === 'connected' ? 'text-destructive' : ''}
                    >
                      {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Webhooks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>Configure webhook endpoints for n8n/Zapier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Lead Webhook URL</label>
                <Input placeholder="https://hooks.zapier.com/..." />
                <p className="text-xs text-muted-foreground">
                  Triggered when a new lead is created
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead Status Change Webhook</label>
                <Input placeholder="https://n8n.your-domain.com/webhook/..." />
                <p className="text-xs text-muted-foreground">
                  Triggered when a lead status changes
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Alert Webhook</label>
                <Input placeholder="https://hooks.slack.com/..." />
                <p className="text-xs text-muted-foreground">
                  Triggered for campaign performance alerts
                </p>
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Webhooks
              </Button>
            </CardContent>
          </Card>

          {/* Data Sync */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Data Synchronization
              </CardTitle>
              <CardDescription>Configure data sync between sources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">Auto-sync from Airtable</div>
                  <div className="text-sm text-muted-foreground">
                    Sync data every 5 minutes
                  </div>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">Two-way sync</div>
                  <div className="text-sm text-muted-foreground">
                    Changes in Naybourhood update Airtable
                  </div>
                </div>
                <Button variant="outline" size="sm">Enabled</Button>
              </div>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Sync Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lead Scoring */}
      {activeTab === 'scoring' && (
        <div className="space-y-6">
          {/* Score Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Score Thresholds
              </CardTitle>
              <CardDescription>Define lead quality thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-success" />
                      Hot Lead Threshold
                    </label>
                    <span className="text-sm text-muted-foreground">
                      Score ≥ {scoringConfig.hotThreshold}
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="50"
                    max="100"
                    value={scoringConfig.hotThreshold}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        hotThreshold: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-warning" />
                      Warm Lead Threshold
                    </label>
                    <span className="text-sm text-muted-foreground">
                      Score ≥ {scoringConfig.warmThreshold}
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="20"
                    max="79"
                    value={scoringConfig.warmThreshold}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        warmThreshold: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leads below {scoringConfig.warmThreshold} will be marked as Cold
              </p>
            </CardContent>
          </Card>

          {/* Scoring Weights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Scoring Weights
              </CardTitle>
              <CardDescription>
                Adjust how different factors contribute to the lead score (must total 100%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Budget Match</label>
                    <span className="text-sm text-muted-foreground">
                      {scoringConfig.weightBudget}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="0"
                    max="50"
                    value={scoringConfig.weightBudget}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        weightBudget: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Purchase Timeline</label>
                    <span className="text-sm text-muted-foreground">
                      {scoringConfig.weightTimeline}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="0"
                    max="50"
                    value={scoringConfig.weightTimeline}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        weightTimeline: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Mortgage Status</label>
                    <span className="text-sm text-muted-foreground">
                      {scoringConfig.weightMortgage}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="0"
                    max="50"
                    value={scoringConfig.weightMortgage}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        weightMortgage: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Location Match</label>
                    <span className="text-sm text-muted-foreground">
                      {scoringConfig.weightLocation}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="0"
                    max="50"
                    value={scoringConfig.weightLocation}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        weightLocation: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Engagement Level</label>
                    <span className="text-sm text-muted-foreground">
                      {scoringConfig.weightEngagement}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    min="0"
                    max="50"
                    value={scoringConfig.weightEngagement}
                    onChange={(e) =>
                      setScoringConfig({
                        ...scoringConfig,
                        weightEngagement: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm">
                  Total Weight:{' '}
                  <span
                    className={
                      scoringConfig.weightBudget +
                        scoringConfig.weightTimeline +
                        scoringConfig.weightMortgage +
                        scoringConfig.weightLocation +
                        scoringConfig.weightEngagement ===
                      100
                        ? 'text-success'
                        : 'text-destructive'
                    }
                  >
                    {scoringConfig.weightBudget +
                      scoringConfig.weightTimeline +
                      scoringConfig.weightMortgage +
                      scoringConfig.weightLocation +
                      scoringConfig.weightEngagement}
                    %
                  </span>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Scoring Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure when and how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">New Lead Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified when new leads come in
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">Hot Lead Priority</div>
                    <div className="text-sm text-muted-foreground">
                      Immediate alerts for high-score leads
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">Campaign Performance</div>
                    <div className="text-sm text-muted-foreground">
                      Daily summary of campaign metrics
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">CPL Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Alert when CPL exceeds threshold
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Disabled</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium">Billing Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Payment failures and subscription changes
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Enabled</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>Configure email notification delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Email</label>
                <Input defaultValue="admin@naybourhood.ai" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Digest Time</label>
                <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="08:00">8:00 AM</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="18:00">6:00 PM</option>
                </select>
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API & Security */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>Manage API access for external integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Production API Key</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-muted-foreground font-mono">
                    {showApiKey
                      ? 'sk_live_Naybourhood_a1b2c3d4e5f6g7h8i9j0'
                      : 'sk_live_•••••••••••••••••••••••••'
                    }
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Created Jan 15, 2024 · Last used 2 hours ago
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Test API Key</span>
                  <Badge variant="warning">Test Mode</Badge>
                </div>
                <code className="text-sm text-muted-foreground font-mono">
                  sk_test_•••••••••••••••••••••••••
                </code>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate New Key
                </Button>
                <Button variant="outline" className="text-destructive">
                  Revoke All Keys
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    Require 2FA for all admin accounts
                  </div>
                </div>
                <Button variant="outline" size="sm">Disabled</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">Session Timeout</div>
                  <div className="text-sm text-muted-foreground">
                    Auto logout after inactivity
                  </div>
                </div>
                <select className="h-9 px-3 rounded-md border border-input bg-background text-sm">
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                  <option value="480">8 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">IP Whitelist</div>
                  <div className="text-sm text-muted-foreground">
                    Restrict API access to specific IPs
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">Audit Log</div>
                  <div className="text-sm text-muted-foreground">
                    Track all admin actions
                  </div>
                </div>
                <Button variant="outline" size="sm">View Logs</Button>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limiting */}
          <Card>
            <CardHeader>
              <CardTitle>API Rate Limits</CardTitle>
              <CardDescription>Current rate limiting configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Requests/minute</p>
                  <p className="text-2xl font-bold">100</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Requests/hour</p>
                  <p className="text-2xl font-bold">1,000</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Requests/day</p>
                  <p className="text-2xl font-bold">10,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
