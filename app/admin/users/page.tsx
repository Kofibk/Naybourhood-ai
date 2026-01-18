'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { INTERNAL_ROLES, CLIENT_ROLES, type UserRole } from '@/types'
import {
  Plus,
  Search,
  UserCircle,
  Trash2,
  X,
  Mail,
  Building2,
  Shield,
  CheckCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Clock,
  UserCheck,
  UserX,
  Crown,
  Users,
  Briefcase,
  Eye,
} from 'lucide-react'

interface InviteUser {
  name: string
  email: string
  role: UserRole
  company_id?: string
  is_internal?: boolean
}

export default function UsersPage() {
  const { users, companies, isLoading, refreshData } = useData()
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'internal' | 'client'>('all')
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

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin'

  // Create company lookup map for displaying names instead of UUIDs
  const companyNameMap = useMemo(() => {
    const map = new Map<string, string>()
    companies.forEach(c => {
      if (c.id && c.name) {
        map.set(c.id, c.name)
      }
    })
    return map
  }, [companies])

  // Separate internal team and client users
  const { internalUsers, clientUsers } = useMemo(() => {
    const internal = users.filter(u => u.is_internal || INTERNAL_ROLES.includes(u.role as UserRole))
    const clients = users.filter(u => !u.is_internal && CLIENT_ROLES.includes(u.role as UserRole))
    return { internalUsers: internal, clientUsers: clients }
  }, [users])

  // Calculate status counts
  const statusCounts = useMemo(() => {
    return {
      pending: users.filter(u => u.status === 'pending').length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
    }
  }, [users])

  // Filter users based on all criteria
  const filteredUsers = useMemo(() => {
    let baseUsers = users

    // Filter by user type (internal vs client)
    if (userTypeFilter === 'internal') {
      baseUsers = internalUsers
    } else if (userTypeFilter === 'client') {
      baseUsers = clientUsers
    }

    return baseUsers.filter((user) => {
      const matchesSearch = !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, internalUsers, clientUsers, searchQuery, roleFilter, statusFilter, userTypeFilter])

  const handleOpenInviteModal = (isInternal: boolean = false) => {
    setInviteData({
      name: '',
      email: '',
      role: isInternal ? 'admin' : 'agent',
      company_id: '',
      is_internal: isInternal,
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
      setMessage({ type: 'error', text: 'Company is required for client users' })
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
          inviter_role: currentUser?.role,
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

  const getRoleBadge = (role: string, isInternal?: boolean) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-orange-600">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        )
      case 'admin':
        return (
          <Badge variant="default" className="bg-purple-600">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
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

  // Get role options based on user type
  const getRoleOptions = () => {
    if (inviteData.is_internal) {
      // Only super admin can create other super admins
      if (isSuperAdmin) {
        return [
          { value: 'super_admin', label: 'Super Admin' },
          { value: 'admin', label: 'Admin' },
        ]
      }
      return [{ value: 'admin', label: 'Admin' }]
    }
    return [
      { value: 'developer', label: 'Developer' },
      { value: 'agent', label: 'Agent' },
      { value: 'broker', label: 'Broker' },
    ]
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
            className="ml-auto"
            onClick={() => setMessage(null)}
            aria-label="Dismiss message"
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
            Manage platform users and permissions ({users.length} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => handleOpenInviteModal(false)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {/* User Type Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <button
          onClick={() => setUserTypeFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            userTypeFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          All Users (<span className="tabular-nums">{users.length}</span>)
        </button>
        <button
          onClick={() => setUserTypeFilter('internal')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors flex items-center gap-2 ${
            userTypeFilter === 'internal'
              ? 'bg-purple-600 text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Users className="h-4 w-4" />
          Naybourhood Team (<span className="tabular-nums">{internalUsers.length}</span>)
        </button>
        <button
          onClick={() => setUserTypeFilter('client')}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors flex items-center gap-2 ${
            userTypeFilter === 'client'
              ? 'bg-blue-600 text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Client Users (<span className="tabular-nums">{clientUsers.length}</span>)
        </button>
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
          <optgroup label="Internal Team">
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
          </optgroup>
          <optgroup label="Client Users">
            <option value="developer">Developer</option>
            <option value="agent">Agent</option>
            <option value="broker">Broker</option>
          </optgroup>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="all">All Status ({users.length})</option>
          <option value="pending">Pending ({statusCounts.pending})</option>
          <option value="active">Active ({statusCounts.active})</option>
          <option value="inactive">Inactive ({statusCounts.inactive})</option>
        </select>
      </div>

      {/* Internal Team Section - Only show when viewing internal */}
      {userTypeFilter === 'internal' && (
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Naybourhood Internal Team
              </CardTitle>
              <Button size="sm" onClick={() => handleOpenInviteModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Team Member
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Internal staff can access all user profiles and company dashboards
            </p>
          </CardHeader>
        </Card>
      )}

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
                      {userTypeFilter === 'internal' ? 'Department' : 'Company'}
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
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3 hover:opacity-80">
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
                            <div className="font-medium flex items-center gap-2">
                              {user.name}
                              {user.is_internal && (
                                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                  Team
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="p-4">
                        {getRoleBadge(user.role, user.is_internal)}
                      </td>
                      <td className="p-4 text-sm">
                        {user.is_internal || INTERNAL_ROLES.includes(user.role as UserRole)
                          ? <span className="text-purple-600 dark:text-purple-400">Naybourhood</span>
                          : user.company_id
                            ? companyNameMap.get(user.company_id) || user.company || '-'
                            : '-'
                        }
                      </td>
                      <td className="p-4">
                        {user.status === 'pending' ? (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : user.status === 'active' ? (
                          <Badge variant="default" className="bg-green-600">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(user.last_active)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="icon" aria-label="View user details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {/* Only super admin can delete other admins */}
                          {(isSuperAdmin || (!INTERNAL_ROLES.includes(user.role as UserRole))) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              aria-label="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
              <h3 className="font-semibold flex items-center gap-2">
                {inviteData.is_internal ? (
                  <>
                    <Shield className="h-5 w-5 text-purple-600" />
                    Invite Team Member
                  </>
                ) : (
                  <>
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Invite Client User
                  </>
                )}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {inviteData.is_internal
                  ? 'Add a new Naybourhood team member. They will have access to all user profiles and company dashboards.'
                  : 'The user will receive an email invitation to set up their account.'}
              </p>

              {/* User Type Toggle */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setInviteData({ ...inviteData, is_internal: false, role: 'agent', company_id: '' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    !inviteData.is_internal
                      ? 'bg-background shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Briefcase className="h-4 w-4 inline mr-1" />
                  Client User
                </button>
                <button
                  onClick={() => setInviteData({ ...inviteData, is_internal: true, role: 'admin', company_id: '' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    inviteData.is_internal
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Shield className="h-4 w-4 inline mr-1" />
                  Team Member
                </button>
              </div>

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
                    role: e.target.value as UserRole
                  })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {getRoleOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Company - only show for client users */}
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
              <Button
                onClick={handleSendInvite}
                disabled={isSending || !inviteData.email || !inviteData.name || (!inviteData.is_internal && !inviteData.company_id)}
                className={inviteData.is_internal ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
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
