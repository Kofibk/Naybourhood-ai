'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MessageCircle,
  Phone,
  Mail,
  ArrowDown,
  RefreshCw,
  User,
  Bot,
} from 'lucide-react'

// WhatsApp icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

interface ConversationMessage {
  id: string
  buyer_id?: string
  channel: 'whatsapp' | 'email' | 'sms' | 'phone' | 'in_person'
  direction: 'inbound' | 'outbound'
  content: string
  status?: 'sent' | 'delivered' | 'read' | 'replied'
  sender_name?: string
  created_at: string
}

interface ConversationThreadProps {
  buyerId: string
  buyerName?: string
  buyerPhone?: string
  channel?: 'whatsapp' | 'all'
  maxHeight?: string
  showHeader?: boolean
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return `Yesterday ${date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

function getChannelIcon(channel: string) {
  switch (channel) {
    case 'whatsapp':
      return <WhatsAppIcon className="h-3 w-3" />
    case 'email':
      return <Mail className="h-3 w-3" />
    case 'phone':
    case 'call':
      return <Phone className="h-3 w-3" />
    default:
      return <MessageCircle className="h-3 w-3" />
  }
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'read':
      return 'text-blue-500'
    case 'delivered':
      return 'text-green-500'
    case 'sent':
      return 'text-gray-400'
    case 'replied':
      return 'text-green-600'
    default:
      return 'text-gray-300'
  }
}

export function ConversationThread({
  buyerId,
  buyerName = 'Lead',
  buyerPhone,
  channel = 'all',
  maxHeight = '500px',
  showHeader = true,
}: ConversationThreadProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      if (!supabase) {
        setMessages([])
        setIsLoading(false)
        return
      }

      let query = supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: true })

      // Filter by channel if specified
      if (channel !== 'all') {
        query = query.eq('channel', channel)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('[ConversationThread] Fetch error:', fetchError)
        setError(fetchError.message)
        return
      }

      setMessages(data || [])
    } catch (e) {
      console.error('[ConversationThread] Error:', e)
      setError('Failed to load conversation')
    } finally {
      setIsLoading(false)
    }
  }, [buyerId, channel])

  useEffect(() => {
    if (buyerId) {
      fetchConversations()
    }
  }, [buyerId, channel, fetchConversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, ConversationMessage[]>)

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4 text-green-600" />
              Conversation History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-12 w-1/2 ml-auto" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4 text-green-600" />
              Conversation History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="py-8 text-center">
          <p className="text-destructive mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchConversations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (messages.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4 text-green-600" />
              Conversation History
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="py-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No conversation history yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Messages will appear here when you communicate with this lead
          </p>
          {buyerPhone && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              asChild
            >
              <a href={`https://wa.me/${buyerPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-4 h-4 mr-2 text-green-600" />
                Start WhatsApp Chat
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4 text-green-600" />
              Conversation History
              <Badge variant="secondary" className="text-xs">
                {messages.length} messages
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={scrollToBottom}>
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchConversations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div 
          className="overflow-y-auto px-4 py-3 space-y-4"
          style={{ maxHeight }}
        >
          {Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-3">
                <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                  {date}
                </div>
              </div>
              
              {/* Messages for this date */}
              <div className="space-y-2">
                {dateMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.direction === 'outbound'
                          ? 'bg-green-600 text-white'
                          : 'bg-muted'
                      }`}
                    >
                      {/* Sender indicator for inbound */}
                      {message.direction === 'inbound' && (
                        <div className="flex items-center gap-1 mb-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {buyerName}
                          </span>
                        </div>
                      )}
                      
                      {/* Message content */}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      
                      {/* Footer with time and status */}
                      <div className={`flex items-center justify-end gap-1.5 mt-1 ${
                        message.direction === 'outbound' ? 'text-green-100' : 'text-muted-foreground'
                      }`}>
                        <span className="flex items-center gap-1">
                          {getChannelIcon(message.channel)}
                        </span>
                        <span className="text-[10px]">
                          {formatTimestamp(message.created_at)}
                        </span>
                        {message.direction === 'outbound' && message.status && (
                          <span className={`text-[10px] ${getStatusColor(message.status)}`}>
                            • {message.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick action footer */}
        {buyerPhone && (
          <div className="border-t p-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`https://wa.me/${buyerPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-4 h-4 mr-2 text-green-600" />
                Open WhatsApp
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`tel:${buyerPhone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for fetching conversations (can be used separately)
export function useConversations(buyerId: string, channel?: 'whatsapp' | 'email' | 'sms' | 'phone' | 'all') {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    if (!buyerId || !isSupabaseConfigured()) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      if (!supabase) {
        setMessages([])
        setIsLoading(false)
        return
      }

      let query = supabase
        .from('conversations')
        .select('*')
        .eq('buyer_id', buyerId)
        .order('created_at', { ascending: true })

      if (channel && channel !== 'all') {
        query = query.eq('channel', channel)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        return
      }

      setMessages(data || [])
    } catch (e) {
      setError('Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [buyerId, channel])

  useEffect(() => {
    fetchConversations()
  }, [buyerId, channel, fetchConversations])

  return { messages, isLoading, error, refetch: fetchConversations }
}
