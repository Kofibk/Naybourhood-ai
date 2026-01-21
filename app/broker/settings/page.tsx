'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useData } from '@/contexts/DataContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { UserRole } from '@/types'
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
  Mail,
  UserCircle,
  Shield,
  Send,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const { users, refreshData: refreshUsers } = useData()
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
    role: 'broker' as UserRole,
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
          company_id: companyId,
          is_internal: false,
          inviter_role: user?.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setMessage({
        type: 'success',
        text: `Invitation sent to ${inviteData.email}!`
      })
      setIsInviteModalOpen(false)
      setInviteData({ name: '', email: '', role: 'broker' })
      refreshUsers()
    } catch (e) {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account</p>
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
            <Badge variant="outline">{user?.role || 'broker'}</Badge>
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
              <div className="font-medium">New Lead Alerts</div>
              <div className="text-sm text-muted-foreground">Get notified of new assigned leads</div>
            </div>
            <Button variant="outline" size="sm">Enabled</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Message Notifications</div>
              <div className="text-sm text-muted-foreground">Receive alerts for new messages</div>
            </div>
            <Button variant="outline" size="sm">Enabled</Button>
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
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as UserRole })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="broker">Broker</option>
                  <option value="agent">Agent</option>
                  <option value="developer">Developer</option>
                </select>
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
    </div>
  )
}
