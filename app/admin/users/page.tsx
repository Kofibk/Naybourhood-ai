'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Search,
  UserCircle,
  Edit,
  Trash2,
  X,
  Mail,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw,
} from 'lucide-react'

interface InviteUser {
  name: string
  email: string
  role: 'admin' | 'developer' | 'agent' | 'broker'
  company_id?: string
  is_internal?: boolean
}

export default function UsersPage() {
  const { users, companies, isLoading, refreshData } = useData()
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [inviteData, setInviteData] = useState<InviteUser>({
    name: '',
    email: '',
    role: 'agent',
    company_id: '',
    is_internal: false,
  })
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === 'all' || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  const handleOpenInviteModal = () => {
    setInviteData({
      name: '',
      email: '',
      role: 'agent',
      company_id: '',
      is_internal: false,
    })
    setIsModalOpen(true)
    setMessage(null)
  }

  const handleSendInvite = async () => {
    if (!inviteData.email) {
      setMessage({ type: 'error', text: 'Email is required' })
      return
    }
    if (!inviteData.name) {
      setMessage({ type: 'error', text: 'Name is required' })
      return
    }
    // Company only required for external users
    if (!inviteData.is_internal && !inviteData.company_id) {
      setMessage({ type: 'error', text: 'Company is required for external users' })
      return
    }

    setIsSending(true)
    setMessage(null)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteData.email,
          name: inviteData.name,
          role: inviteData.role,
          company_id: inviteData.is_internal ? null : (inviteData.company_id || null),
          is_internal: inviteData.is_internal,
          inviter_role: currentUser?.role, // For demo mode admin access
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setMessage({
        type: 'success',
        text: `Invitation sent to ${inviteData.email}! They will receive an email to set up their account.`
      })
      setIsModalOpen(false)
      setInviteData({ name: '', email: '', role: 'agent', company_id: '', is_internal: false })

      // Refresh users list
      refreshData()
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to send invitation'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser?.role || '',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      setMessage({ type: 'success', text: 'User deleted successfully!' })
      refreshData()
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to delete user'
      })
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage platform users and permissions ({filteredUsers.length} users)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleOpenInviteModal}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="developer">Developer</option>
          <option value="agent">Agent</option>
          <option value="broker">Broker</option>
        </select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Company
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Last Active
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="p-4 text-sm">{user.company || '-'}</td>
                      <td className="p-4">
                        <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(user.last_active)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        {users.length === 0
                          ? 'No users found. Invite your first user to get started!'
                          : 'No users match your search'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Invite New User</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                The user will receive an email invitation to set up their account and password.
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
                  placeholder="john@example.com"
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
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData({
                    ...inviteData,
                    role: e.target.value as InviteUser['role']
                  })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                  <option value="agent">Agent</option>
                  <option value="broker">Broker</option>
                </select>
              </div>
              {/* Internal Team Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                <input
                  type="checkbox"
                  id="is_internal"
                  checked={inviteData.is_internal}
                  onChange={(e) => setInviteData({
                    ...inviteData,
                    is_internal: e.target.checked,
                    company_id: e.target.checked ? '' : inviteData.company_id
                  })}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="is_internal" className="text-sm cursor-pointer">
                  <span className="font-medium">Internal Team Member</span>
                  <p className="text-xs text-muted-foreground">Naybourhood staff (no company required)</p>
                </label>
              </div>

              {/* Company - only show for external users */}
              {!inviteData.is_internal && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company *
                  </label>
                  <select
                    value={inviteData.company_id || ''}
                    onChange={(e) => setInviteData({ ...inviteData, company_id: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendInvite} disabled={isSending || !inviteData.email || !inviteData.name || (!inviteData.is_internal && !inviteData.company_id)}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
