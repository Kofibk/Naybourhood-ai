'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MessageSquare, Phone } from 'lucide-react'

const conversations = [
  { id: 'C001', name: 'James Chen', lastMessage: 'What documents do I need for the application?', time: '1 hour ago', unread: 1 },
  { id: 'C002', name: 'Sarah Williams', lastMessage: 'The mortgage has been approved!', time: '3 hours ago', unread: 0 },
]

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Conversations</h2>
        <p className="text-sm text-muted-foreground">Client communications</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search conversations..." className="pl-9" />
      </div>

      <div className="space-y-3">
        {conversations.map((conv) => (
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
                      {conv.unread > 0 && <Badge>{conv.unread}</Badge>}
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
        ))}
      </div>
    </div>
  )
}
