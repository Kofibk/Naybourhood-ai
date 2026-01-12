'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, MessageSquare, Phone, Mail, Clock, Sparkles } from 'lucide-react'

// Demo conversations for investor pitch
const DEMO_CONVERSATIONS = [
  {
    id: 'conv-1',
    name: 'James Richardson',
    email: 'james.richardson@email.com',
    lastMessage: 'Thank you for the property details. I would like to schedule a viewing for The Bishops Avenue property this weekend if possible.',
    time: '30 mins ago',
    status: 'Viewing Booked',
    unread: true,
    budget: '£2.5M - £3.5M',
    aiSuggestion: 'High intent - confirm viewing time slot',
  },
  {
    id: 'conv-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@luxurymail.com',
    lastMessage: 'We are very interested in proceeding with the offer. Please let us know the next steps.',
    time: '2 hours ago',
    status: 'Negotiating',
    unread: true,
    budget: '£4M - £6M',
    aiSuggestion: 'Ready to proceed - send contract details',
  },
  {
    id: 'conv-3',
    name: 'Michael Okonkwo',
    email: 'm.okonkwo@corp.com',
    lastMessage: 'The second viewing was excellent. Can we discuss the offer price?',
    time: '4 hours ago',
    status: 'Follow Up',
    unread: false,
    budget: '£1.8M - £2.2M',
    aiSuggestion: 'Schedule call to discuss offer',
  },
  {
    id: 'conv-4',
    name: 'Emma Thompson',
    email: 'emma.t@gmail.com',
    lastMessage: 'Looking forward to the viewing tomorrow. Will my partner be able to attend as well?',
    time: '6 hours ago',
    status: 'Viewing Booked',
    unread: false,
    budget: '£3M - £4M',
    aiSuggestion: 'Confirm additional attendee',
  },
  {
    id: 'conv-5',
    name: 'Fatima Al-Hassan',
    email: 'fatima.ah@email.com',
    lastMessage: 'Solicitor has received the documents. Exchange should be completed by Friday.',
    time: '1 day ago',
    status: 'Reserved',
    unread: false,
    budget: '£6M - £8M',
    aiSuggestion: 'Monitor exchange progress',
  },
  {
    id: 'conv-6',
    name: 'David Patel',
    email: 'dpatel@business.co.uk',
    lastMessage: 'I am interested in properties in the Hampstead area with at least 5 bedrooms.',
    time: '1 day ago',
    status: 'New',
    unread: true,
    budget: '£5M+',
    aiSuggestion: 'Send Hampstead portfolio',
  },
  {
    id: 'conv-7',
    name: 'Alexandra Müller',
    email: 'alex.muller@invest.de',
    lastMessage: 'Thank you for the investment property options. I would like to know more about rental yields.',
    time: '2 days ago',
    status: 'Qualified',
    unread: false,
    budget: '£2M - £3M',
    aiSuggestion: 'Send yield analysis report',
  },
]

export default function ConversationsPage() {
  const [search, setSearch] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const user = JSON.parse(stored)
      setIsDemo(user.company_id === 'mph-company' || !user.company_id)
    } else {
      setIsDemo(true)
    }
  }, [])

  const filteredConversations = useMemo(() => {
    if (!search) return DEMO_CONVERSATIONS
    return DEMO_CONVERSATIONS.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  const unreadCount = DEMO_CONVERSATIONS.filter(c => c.unread).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Conversations</h2>
          <p className="text-sm text-muted-foreground">Manage buyer communications</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} unread</Badge>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {filteredConversations.map((conv) => (
          <Card
            key={conv.id}
            className={`hover:border-primary/50 transition-colors cursor-pointer ${conv.unread ? 'border-primary/30 bg-primary/5' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${conv.unread ? 'bg-primary/20' : 'bg-muted'}`}>
                  <MessageSquare className={`h-6 w-6 ${conv.unread ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${conv.unread ? 'text-primary' : ''}`}>{conv.name}</h3>
                      <Badge variant={conv.status === 'Reserved' ? 'success' : conv.status === 'Negotiating' ? 'warning' : 'outline'} className="text-[10px]">
                        {conv.status}
                      </Badge>
                      {conv.unread && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {conv.time}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{conv.budget}</p>
                  <p className={`text-sm truncate ${conv.unread ? 'font-medium' : 'text-muted-foreground'}`}>
                    {conv.lastMessage}
                  </p>
                  {conv.aiSuggestion && (
                    <p className="text-xs text-primary mt-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI: {conv.aiSuggestion}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Mail className="h-4 w-4" />
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
