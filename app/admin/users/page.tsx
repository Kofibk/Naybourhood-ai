'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, MoreVertical, UserCircle } from 'lucide-react'

const users = [
  {
    id: 'U001',
    name: 'Kofi',
    email: 'admin@naybourhood.ai',
    role: 'Admin',
    status: 'Active',
    lastActive: '2 minutes ago',
  },
  {
    id: 'U002',
    name: 'John Smith',
    email: 'developer@test.com',
    role: 'Developer',
    company: 'Berkeley Group',
    status: 'Active',
    lastActive: '1 hour ago',
  },
  {
    id: 'U003',
    name: 'Michael Davies',
    email: 'agent@test.com',
    role: 'Agent',
    company: 'JLL',
    status: 'Active',
    lastActive: '3 hours ago',
  },
  {
    id: 'U004',
    name: 'Lisa Green',
    email: 'broker@test.com',
    role: 'Broker',
    company: 'Tudor Financial',
    status: 'Active',
    lastActive: '1 day ago',
  },
]

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage platform users and permissions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
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
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          <UserCircle className="h-5 w-5 text-muted-foreground" />
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
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="p-4 text-sm">{user.company || '-'}</td>
                    <td className="p-4">
                      <Badge variant="success">{user.status}</Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.lastActive}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
