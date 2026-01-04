'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { Search, MessageSquare, Phone, Users } from 'lucide-react'

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

export default function ConversationsPage() {
  const { leads, isLoading } = useData()
  const { user } = useAuth()

  // Filter leads by company_id first
  const myLeads = useMemo(() => {
    if (!user?.company_id) return []
    return leads.filter(lead => lead.company_id === user.company_id)
  }, [leads, user?.company_id])

  // Get leads with recent activity as conversations
  const conversations = useMemo(() => {
    return myLeads
      .filter(l => l.last_contact || l.created_at)
      .sort((a, b) => {
        const dateA = new Date(a.last_contact || a.created_at || 0)
        const dateB = new Date(b.last_contact || b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 10)
      .map(lead => ({
        id: lead.id,
        name: lead.full_name || lead.first_name || 'Unknown',
        lastMessage: `Interested in ${lead.location || 'properties'} - ${lead.budget || 'Budget TBC'}`,
        time: getTimeAgo(lead.last_contact || lead.created_at || ''),
        status: lead.status,
      }))
  }, [myLeads])

  // Show message if not assigned to company
  if (!user?.company_id) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold font-display">Conversations</h2>
          <p className="text-sm text-muted-foreground">Manage buyer communications</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Your account is not linked to a company.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact an administrator to assign you to a company.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Conversations</h2>
        <p className="text-sm text-muted-foreground">Manage buyer communications</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search conversations..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No conversations yet</p>
            </CardContent>
          </Card>
        ) : (
          conversations.map((conv) => (
            <Card key={conv.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{conv.name}</h3>
                        {conv.status && <Badge variant="outline">{conv.status}</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
