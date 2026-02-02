'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { Buyer, FinanceLead } from '@/types'
import {
  Search,
  MessageSquare,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Users,
  Mail,
  Clock,
  Filter,
  ChevronRight,
  User,
  Building,
  Calendar,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'

// WhatsApp icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export type ConversationSource = 'leads' | 'borrowers'

interface ConversationItem {
  id: string
  name: string
  email?: string
  phone?: string
  status?: string
  lastMessage?: string
  lastContact?: string
  budget?: string
  location?: string
  channel?: 'call' | 'whatsapp' | 'email' | 'all'
  callStatus?: 'answered' | 'missed' | 'voicemail'
  callDirection?: 'inbound' | 'outbound'
  callDuration?: number
  type: 'lead' | 'borrower'
}

interface ConversationsViewProps {
  leads?: Buyer[]
  borrowers?: FinanceLead[]
  source: ConversationSource
  isLoading?: boolean
  basePath: string  // e.g., '/developer', '/broker', '/admin'
  title?: string
  subtitle?: string
  emptyMessage?: string
  showCompanyFilter?: boolean
}

function getTimeAgo(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} mins ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatDuration(seconds?: number): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

export function ConversationsView({
  leads = [],
  borrowers = [],
  source,
  isLoading = false,
  basePath,
  title = 'Conversations',
  subtitle = 'Manage communications',
  emptyMessage = 'No conversations yet',
  showCompanyFilter = false,
}: ConversationsViewProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<'all' | 'call' | 'whatsapp' | 'email'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null)

  // Convert data to unified conversation format
  const conversations = useMemo((): ConversationItem[] => {
    if (source === 'leads') {
      return leads
        .filter(l => l.last_contact || l.created_at || l.phone || l.email)
        .sort((a, b) => {
          const dateA = new Date(a.last_contact || a.created_at || 0)
          const dateB = new Date(b.last_contact || b.created_at || 0)
          return dateB.getTime() - dateA.getTime()
        })
        .map(lead => ({
          id: lead.id,
          name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          lastMessage: lead.last_wa_message || lead.call_summary || `Interested in ${lead.preferred_location || lead.location || 'properties'} - ${lead.budget_range || lead.budget || 'Budget TBC'}`,
          lastContact: lead.last_contact || lead.created_at,
          budget: lead.budget_range || lead.budget,
          location: lead.preferred_location || lead.location,
          channel: lead.last_wa_message ? 'whatsapp' : (lead.call_summary ? 'call' : 'all'),
          type: 'lead' as const,
        }))
    } else {
      return borrowers
        .filter(b => b.created_at || b.phone || b.email)
        .sort((a, b) => {
          const dateA = new Date(a.created_at || 0)
          const dateB = new Date(b.created_at || 0)
          return dateB.getTime() - dateA.getTime()
        })
        .map(borrower => ({
          id: borrower.id,
          name: borrower.full_name || `${borrower.first_name || ''} ${borrower.last_name || ''}`.trim() || 'Unknown',
          email: borrower.email,
          phone: borrower.phone,
          status: borrower.status,
          lastMessage: borrower.message || `${borrower.finance_type || 'Finance'} - ${borrower.loan_amount ? `£${(borrower.loan_amount / 1000).toFixed(0)}K` : 'Amount TBC'}`,
          lastContact: borrower.created_at,
          budget: borrower.loan_amount ? `£${(borrower.loan_amount / 1000).toFixed(0)}K` : undefined,
          channel: 'all',
          type: 'borrower' as const,
        }))
    }
  }, [leads, borrowers, source])

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          conv.name.toLowerCase().includes(searchLower) ||
          conv.email?.toLowerCase().includes(searchLower) ||
          conv.phone?.includes(search) ||
          conv.lastMessage?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Channel filter
      if (channelFilter !== 'all' && conv.channel !== channelFilter && conv.channel !== 'all') {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && conv.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [conversations, search, channelFilter, statusFilter])

  // Get unique statuses for filter
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>()
    conversations.forEach(c => {
      if (c.status) statuses.add(c.status)
    })
    return Array.from(statuses).sort()
  }, [conversations])

  // Stats
  const stats = useMemo(() => ({
    total: conversations.length,
    calls: conversations.filter(c => c.channel === 'call').length,
    whatsapp: conversations.filter(c => c.channel === 'whatsapp').length,
    pending: conversations.filter(c => c.status === 'Contact Pending').length,
  }), [conversations])

  // Handle call action
  const handleCall = useCallback((phone?: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (phone) {
      // This will be replaced with Aircall SDK call
      window.open(`tel:${phone}`, '_self')
    }
  }, [])

  // Handle WhatsApp action
  const handleWhatsApp = useCallback((phone?: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '')
      window.open(`https://wa.me/${cleanPhone.replace('+', '')}`, '_blank')
    }
  }, [])

  // Handle email action
  const handleEmail = useCallback((email?: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (email) {
      window.open(`mailto:${email}`, '_self')
    }
  }, [])

  // Open conversation in slide panel
  const handleViewDetail = useCallback((conv: ConversationItem) => {
    setSelectedConversation(conv)
  }, [])

  // Navigate to full lead/borrower detail page
  const handleViewFullProfile = useCallback((conv: ConversationItem) => {
    const detailPath = conv.type === 'lead'
      ? `${basePath}/leads/${conv.id}`
      : `${basePath}/borrowers/${conv.id}`
    router.push(detailPath)
  }, [router, basePath])

  // Get status badge variant
  const getStatusVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Contact Pending': return 'default'
      case 'Follow-up': return 'secondary'
      case 'Viewing Booked': return 'default'
      case 'Not Proceeding': return 'destructive'
      case 'Completed': return 'default'
      default: return 'outline'
    }
  }

  // Get channel icon
  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'call': return <PhoneCall className="h-4 w-4 text-green-500" />
      case 'whatsapp': return <WhatsAppIcon className="h-4 w-4 text-green-500" />
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />
      default: return <MessageSquare className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(channelFilter !== 'all' || statusFilter !== 'all') && (
              <Badge variant="secondary" className="ml-2 text-xs">Active</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => { setChannelFilter('all'); setStatusFilter('all') }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setStatusFilter('Contact Pending')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-xl font-bold text-yellow-500">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setChannelFilter('call')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Calls</span>
            </div>
            <p className="text-xl font-bold text-green-500">{stats.calls}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50" onClick={() => setChannelFilter('whatsapp')}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <WhatsAppIcon className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">WhatsApp</span>
            </div>
            <p className="text-xl font-bold text-green-600">{stats.whatsapp}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, or message..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Channel</label>
                <div className="flex gap-1">
                  {(['all', 'call', 'whatsapp', 'email'] as const).map(channel => (
                    <Button
                      key={channel}
                      variant={channelFilter === channel ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChannelFilter(channel)}
                    >
                      {channel === 'all' && 'All'}
                      {channel === 'call' && <><Phone className="h-3 w-3 mr-1" /> Call</>}
                      {channel === 'whatsapp' && <><WhatsAppIcon className="h-3 w-3 mr-1" /> WhatsApp</>}
                      {channel === 'email' && <><Mail className="h-3 w-3 mr-1" /> Email</>}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {availableStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {(channelFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setChannelFilter('all'); setStatusFilter('all') }}
                  className="self-end"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversations List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Loading conversations...</p>
            </CardContent>
          </Card>
        ) : filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{search ? 'No conversations match your search' : emptyMessage}</p>
              {search && (
                <Button variant="link" onClick={() => setSearch('')} className="mt-2">
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredConversations.map((conv) => (
            <Card
              key={conv.id}
              className="hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={() => handleViewDetail(conv)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getChannelIcon(conv.channel)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="font-semibold truncate">{conv.name}</h3>
                        {conv.status && (
                          <Badge variant={getStatusVariant(conv.status)} className="text-xs whitespace-nowrap">
                            {conv.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {conv.lastContact && (
                          <span className="text-xs text-muted-foreground">{getTimeAgo(conv.lastContact)}</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground truncate mb-2">{conv.lastMessage}</p>

                    {/* Contact Info & Quick Actions */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {conv.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {conv.phone}
                          </span>
                        )}
                        {conv.budget && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {conv.budget}
                          </span>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {conv.phone && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              onClick={(e) => handleCall(conv.phone, e)}
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              onClick={(e) => handleWhatsApp(conv.phone, e)}
                              title="WhatsApp"
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {conv.email && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                            onClick={(e) => handleEmail(conv.email, e)}
                            title="Email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination hint */}
      {filteredConversations.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Conversation Slide Panel */}
      <Sheet open={!!selectedConversation} onOpenChange={(open) => !open && setSelectedConversation(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
          {selectedConversation && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-xl">{selectedConversation.name}</SheetTitle>
                    <SheetDescription>
                      {selectedConversation.phone && (
                        <span className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {selectedConversation.phone}
                        </span>
                      )}
                    </SheetDescription>
                  </div>
                  {selectedConversation.status && (
                    <Badge variant={getStatusVariant(selectedConversation.status)}>
                      {selectedConversation.status}
                    </Badge>
                  )}
                </div>
                
                {/* Quick Actions in Header */}
                <div className="flex gap-2 mt-4">
                  {selectedConversation.phone && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCall(selectedConversation.phone)}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleWhatsApp(selectedConversation.phone)}
                      >
                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    </>
                  )}
                  {selectedConversation.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEmail(selectedConversation.email)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                </div>
              </SheetHeader>

              {/* Last Message Preview */}
              <div className="mt-4 space-y-4">
                {/* Contact Details Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contact Details
                    </h4>
                    {selectedConversation.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedConversation.email}</span>
                      </div>
                    )}
                    {selectedConversation.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>Budget: {selectedConversation.budget}</span>
                      </div>
                    )}
                    {selectedConversation.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>Location: {selectedConversation.location}</span>
                      </div>
                    )}
                    {selectedConversation.lastContact && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Last Contact: {getTimeAgo(selectedConversation.lastContact)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Last WhatsApp Message */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <WhatsAppIcon className="h-4 w-4 text-green-600" />
                      Last WhatsApp Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedConversation.lastMessage ? (
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
                        <p className="text-sm whitespace-pre-wrap">{selectedConversation.lastMessage}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No WhatsApp messages yet</p>
                        {selectedConversation.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => handleWhatsApp(selectedConversation.phone)}
                          >
                            <WhatsAppIcon className="h-4 w-4 mr-2 text-green-600" />
                            Start Conversation
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Info Note */}
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      This shows the last recorded message. Full conversation history requires WhatsApp Business API integration.
                    </span>
                  </p>
                </div>
              </div>

              {/* View Full Profile Link */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleViewFullProfile(selectedConversation)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full {selectedConversation.type === 'lead' ? 'Lead' : 'Borrower'} Profile
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Empty state component for when user is not assigned to a company
export function ConversationsEmptyCompany({
  title = 'Conversations',
  subtitle = 'Manage communications'
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
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
