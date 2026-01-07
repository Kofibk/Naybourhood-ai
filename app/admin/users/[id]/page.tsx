'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { INTERNAL_ROLES, CLIENT_ROLES, type UserRole, type AppUser } from '@/types'
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  UserCheck,
  UserX,
  Crown,
  Edit,
  Save,
  Calendar,
  Briefcase,
  Globe,
  FileText,
  CreditCard,
} from 'lucide-react'

// Editable Text Field Component
function EditableTextField({
  label,
  value,
  field,
  onSave,
  icon: Icon,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string | null | undefined
  field: string
  onSave: (field: string, value: string) => void
  icon?: any
  type?: 'text' | 'email' | 'tel'
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value || ''))

  useEffect(() => {
    setTempValue(String(value || ''))
  }, [value])

  const handleSave = () => {
    onSave(field, tempValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(String(value || ''))
    setEditing(false)
  }

  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0 group">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      {editing && !disabled ? (
        <div className="flex items-center gap-2">
          <Input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="h-8 w-48"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
            <XCircle className="h-4 w-4 text-red-400" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{value || '-'}</span>
          {!disabled && (
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
              onClick={() => setEditing(true)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Editable Select Field Component
function EditableSelectField({
  label,
  value,
  field,
  options,
  onSave,
  icon: Icon,
  disabled = false,
}: {
  label: string
  value: string | undefined | null
  field: string
  options: { value: string; label: string }[]
  onSave: (field: string, value: string) => void
  icon?: any
  disabled?: boolean
}) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      {disabled ? (
        <span className="text-sm font-medium">{options.find(o => o.value === value)?.label || value || '-'}</span>
      ) : (
        <select
          value={value || ''}
          onChange={(e) => onSave(field, e.target.value)}
          className="text-sm bg-background border border-input rounded-md px-2 py-1"
        >
          <option value="">-</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}

// Editable Textarea Component
function EditableTextarea({
  label,
  value,
  field,
  onSave,
  icon: Icon,
}: {
  label: string
  value: string | null | undefined
  field: string
  onSave: (field: string, value: string) => void
  icon?: any
}) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(String(value || ''))

  useEffect(() => {
    setTempValue(String(value || ''))
  }, [value])

  const handleSave = () => {
    onSave(field, tempValue)
    setEditing(false)
  }

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </span>
        {!editing ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Edit className="h-3 w-3 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3 w-3 mr-1" /> Save
            </Button>
          </div>
        )}
      </div>
      {editing ? (
        <Textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          rows={4}
          className="text-sm"
        />
      ) : (
        <p className="text-sm bg-muted/50 rounded-lg p-3 min-h-[80px]">
          {value || <span className="text-muted-foreground italic">No bio provided</span>}
        </p>
      )}
    </div>
  )
}

// Data Row Component (read-only)
function DataRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      <span className="text-sm font-medium">{value || '-'}</span>
    </div>
  )
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { users, companies, isLoading, refreshData } = useData()
  const { user: currentUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Find the user
  const user = useMemo(() => {
    return users.find(u => u.id === params.id) as AppUser | undefined
  }, [users, params.id])

  // Check permissions
  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isOwnProfile = currentUser?.id === user?.id
  const isInternalUser = user?.is_internal || INTERNAL_ROLES.includes(user?.role as UserRole)
  const canEdit = isSuperAdmin || isOwnProfile

  // Create company lookup
  const companyNameMap = useMemo(() => {
    const map = new Map<string, string>()
    companies.forEach(c => {
      if (c.id && c.name) {
        map.set(c.id, c.name)
      }
    })
    return map
  }, [companies])

  const handleFieldSave = async (field: string, value: string) => {
    if (!user) return

    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || '',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      setMessage({ type: 'success', text: 'User updated successfully!' })
      refreshData()
    } catch (e) {
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Failed to update user'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleBadge = (role: string) => {
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
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Link href="/admin/users" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-2">User not found</h3>
            <p className="text-muted-foreground mb-4">The user you are looking for does not exist.</p>
            <Button onClick={() => router.push('/admin/users')}>Back to Users</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const roleOptions = isInternalUser
    ? [
        { value: 'super_admin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
      ]
    : [
        { value: 'developer', label: 'Developer' },
        { value: 'agent', label: 'Agent' },
        { value: 'broker', label: 'Broker' },
      ]

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link href="/admin/users" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
        <Button variant="outline" size="sm" onClick={() => refreshData()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Header */}
      <Card className={isInternalUser ? 'border-purple-500/30 bg-purple-500/5' : ''}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <UserCircle className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {getRoleBadge(user.role)}
                {isInternalUser && (
                  <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded">
                    Naybourhood Team
                  </span>
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              {user.phone && (
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4" />
                  {user.phone}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3">
                {user.status === 'active' ? (
                  <Badge variant="default" className="bg-green-600">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : user.status === 'pending' ? (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <UserX className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
                {isOwnProfile && (
                  <span className="text-xs text-muted-foreground">(This is your profile)</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle className="w-4 h-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextField
              label="Full Name"
              value={user.name}
              field="name"
              onSave={handleFieldSave}
              icon={UserCircle}
              disabled={!canEdit}
            />
            <EditableTextField
              label="Email"
              value={user.email}
              field="email"
              onSave={handleFieldSave}
              icon={Mail}
              type="email"
              disabled={!canEdit}
            />
            <EditableTextField
              label="Phone"
              value={user.phone}
              field="phone"
              onSave={handleFieldSave}
              icon={Phone}
              type="tel"
              disabled={!canEdit}
            />
            <EditableTextField
              label="Job Title"
              value={user.job_title}
              field="job_title"
              onSave={handleFieldSave}
              icon={Briefcase}
              disabled={!canEdit}
            />
          </CardContent>
        </Card>

        {/* Role & Permissions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableSelectField
              label="Role"
              value={user.role}
              field="role"
              options={roleOptions}
              onSave={handleFieldSave}
              icon={Shield}
              disabled={!isSuperAdmin}
            />
            <EditableSelectField
              label="Status"
              value={user.status}
              field="status"
              options={statusOptions}
              onSave={handleFieldSave}
              icon={UserCheck}
              disabled={!isSuperAdmin}
            />
            {!isInternalUser && (
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company
                </span>
                <span className="text-sm font-medium">
                  {user.company_id ? companyNameMap.get(user.company_id) || user.company : '-'}
                </span>
              </div>
            )}
            <DataRow
              label="Email Verified"
              value={user.email_confirmed ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" /> Yes
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Pending
                </span>
              )}
            />
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EditableTextarea
              label="About"
              value={user.bio}
              field="bio"
              onSave={handleFieldSave}
              icon={FileText}
            />
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataRow label="Last Active" value={formatDateTime(user.last_active)} icon={Clock} />
            <DataRow label="Account Created" value={formatDate(user.created_at)} icon={Calendar} />
            <DataRow label="Invited On" value={formatDate(user.invited_at)} icon={Mail} />
          </CardContent>
        </Card>

        {/* Billing - Only show to Super Admin */}
        {isSuperAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Billing Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataRow
                label="Can View Billing"
                value={user.role === 'super_admin' ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              />
              <p className="text-xs text-muted-foreground mt-3 p-3 bg-muted/50 rounded">
                Only Super Admins can access billing information and manage subscription settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User ID */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>User ID:</span>
            <code className="bg-muted px-2 py-1 rounded">{user.id}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
