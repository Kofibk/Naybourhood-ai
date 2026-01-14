'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Bell, User, CreditCard, Save, CheckCircle, AlertCircle, Building2, Bot, Flame, Clock, Zap } from 'lucide-react'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editedName, setEditedName] = useState('')
  const [companyData, setCompanyData] = useState<{
    name?: string
    subscription_tier?: string
    subscription_status?: string
  } | null>(null)

  useEffect(() => {
    setEditedName(user?.name || '')

    // Fetch company data if user has company_id
    if (user?.company_id && isSupabaseConfigured()) {
      const fetchCompany = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('companies')
          .select('name, subscription_tier, subscription_status')
          .eq('id', user.company_id)
          .single()

        if (data) {
          setCompanyData(data)
        }
      }
      fetchCompany()
    }
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
      // Parse first and last name from edited name
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
        // Refresh user data in context
        await refreshUser()
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving.' })
    } finally {
      setIsSaving(false)
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

  return (
    <div className="space-y-6">
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
            <Badge variant="outline">{user?.role || 'agent'}</Badge>
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
              <p className="text-sm text-muted-foreground">
                Contact your company administrator to manage subscription settings.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">No company subscription found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Contact support to set up your organisation.
              </p>
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
              <div className="font-medium">New Buyer Alerts</div>
              <div className="text-sm text-muted-foreground">
                Get notified when new buyers match your criteria
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

      {/* AI Notifications & Tasks */}
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
    </div>
  )
}
