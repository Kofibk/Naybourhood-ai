'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MessageSquare, Phone, MoreVertical } from 'lucide-react'

const conversations = [
  {
    id: 'C001',
    name: 'James Chen',
    lastMessage: 'I am very interested in the 2-bed unit at Nine Elms',
    time: '2 hours ago',
    unread: 2,
    status: 'active',
  },
  {
    id: 'C002',
    name: 'Sarah Williams',
    lastMessage: 'Can we schedule a viewing for this weekend?',
    time: '5 hours ago',
    unread: 0,
    status: 'active',
  },
  {
    id: 'C003',
    name: 'David Park',
    lastMessage: 'Thanks for the information. I will review and get back to you.',
    time: '1 day ago',
    unread: 0,
    status: 'pending',
  },
]

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-display">Conversations</h2>
        <p className="text-sm text-muted-foreground">
          Manage your buyer communications
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search conversations..." className="pl-9" />
      </div>

      {/* Conversations List */}
      <div className="space-y-3">
        {conversations.map((conv) => (
          <Card
            key={conv.id}
            className="hover:border-primary/50 transition-colors cursor-pointer"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{conv.name}</h3>
                      {conv.unread > 0 && (
                        <Badge variant="default" className="text-[10px]">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {conv.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {conv.lastMessage}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
