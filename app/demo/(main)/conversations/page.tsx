'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DEMO_RECENT_LEADS } from '@/lib/demo-data'
import {
  Search,
  Phone,
  MessageCircle,
  Mail,
  ChevronRight,
  X,
} from 'lucide-react'

const DEMO_CONVERSATIONS = [
  {
    leadId: 'demo-lead-001',
    name: 'James Richardson',
    channel: 'whatsapp',
    lastMessage: 'Hi Rowena, confirming I can make the viewing at Keybridge Lofts on Friday at 2pm. Will my solicitor need to be present?',
    time: '10 min ago',
    status: 'Viewing Booked',
    unread: true,
  },
  {
    leadId: 'demo-lead-004',
    name: 'Emily Thornton',
    channel: 'email',
    lastMessage: 'Thank you for the updated pricing schedule. We would like to proceed with the offer on the 3-bed unit at Dollar Bay. Please find attached our solicitors details.',
    time: '1h ago',
    status: 'Negotiating',
    unread: true,
  },
  {
    leadId: 'demo-lead-002',
    name: 'Sarah Chen',
    channel: 'whatsapp',
    lastMessage: 'I have transferred the reservation deposit. Please confirm receipt. Also interested in seeing the penthouse at Keybridge if still available.',
    time: '3h ago',
    status: 'Follow Up',
    unread: false,
  },
  {
    leadId: 'demo-lead-006',
    name: 'Alexandra Muller',
    channel: 'phone',
    lastMessage: 'Call completed — 12 min. Discussed Dollar Bay 2-bed options. Sending brochure and floor plans via email.',
    time: '5h ago',
    status: 'Viewing Booked',
    unread: false,
  },
  {
    leadId: 'demo-lead-003',
    name: 'Mohammed Al-Rashid',
    channel: 'whatsapp',
    lastMessage: 'Good morning. My son starts at UCL in September. We need a 3-bed near central London. Budget is flexible up to £8M. Can you arrange viewings?',
    time: 'Yesterday',
    status: 'Contact Pending',
    unread: false,
  },
  {
    leadId: 'demo-lead-005',
    name: 'Michael Okonkwo',
    channel: 'email',
    lastMessage: 'Following up on our conversation about Royal Eden Docks. Could you share the latest availability and the investor pricing?',
    time: 'Yesterday',
    status: 'Follow Up',
    unread: false,
  },
  {
    leadId: 'demo-lead-007',
    name: 'Priya Sharma',
    channel: 'phone',
    lastMessage: 'Missed call. Left voicemail about Keybridge Lofts 2-bed availability near Waterloo.',
    time: '2d ago',
    status: 'Contact Pending',
    unread: false,
  },
]

const channelIcons: Record<string, typeof Phone> = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
}

const channelColors: Record<string, string> = {
  whatsapp: 'text-green-400 bg-green-400/10',
  phone: 'text-blue-400 bg-blue-400/10',
  email: 'text-purple-400 bg-purple-400/10',
}

export default function DemoConversationsPage() {
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selectedConvo, setSelectedConvo] = useState<typeof DEMO_CONVERSATIONS[0] | null>(null)

  const filtered = DEMO_CONVERSATIONS.filter((c) => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter
    return matchesSearch && matchesChannel
  })

  const selectedLead = selectedConvo ? DEMO_RECENT_LEADS.find(l => l.id === selectedConvo.leadId) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Conversations</h2>
        <p className="text-sm text-white/50">Manage buyer communications</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{DEMO_CONVERSATIONS.length}</p>
          <p className="text-[10px] text-white/40 uppercase">Total</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-yellow-400">{DEMO_CONVERSATIONS.filter(c => c.unread).length}</p>
          <p className="text-[10px] text-white/40 uppercase">Unread</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{DEMO_CONVERSATIONS.filter(c => c.channel === 'whatsapp').length}</p>
          <p className="text-[10px] text-white/40 uppercase">WhatsApp</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{DEMO_CONVERSATIONS.filter(c => c.channel === 'phone').length}</p>
          <p className="text-[10px] text-white/40 uppercase">Calls</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-[#111111] border-white/10 text-white placeholder:text-white/40"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'whatsapp', 'phone', 'email'].map((ch) => (
            <Button
              key={ch}
              variant={channelFilter === ch ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChannelFilter(ch)}
              className={channelFilter !== ch ? 'border-white/10 text-white/70 hover:bg-white/5' : ''}
            >
              {ch === 'all' ? 'All' : ch.charAt(0).toUpperCase() + ch.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Conversation List + Side Panel */}
      <div className="flex gap-4">
        <div className={`space-y-2 ${selectedConvo ? 'w-1/2' : 'w-full'} transition-all`}>
          {filtered.map((convo) => {
            const Icon = channelIcons[convo.channel] || Mail
            return (
              <div
                key={convo.leadId}
                onClick={() => setSelectedConvo(convo)}
                className={`bg-[#111111] border rounded-xl p-4 cursor-pointer transition-colors ${
                  selectedConvo?.leadId === convo.leadId
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${channelColors[convo.channel]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${convo.unread ? 'text-white' : 'text-white/70'}`}>{convo.name}</p>
                        {convo.unread && <div className="h-2 w-2 rounded-full bg-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-white/30">{convo.time}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{convo.lastMessage}</p>
                    <Badge variant="secondary" className="mt-1.5 text-[10px]">{convo.status}</Badge>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20 flex-shrink-0 mt-1" />
                </div>
              </div>
            )
          })}
        </div>

        {/* Side Panel */}
        {selectedConvo && selectedLead && (
          <div className="w-1/2 bg-[#111111] border border-white/10 rounded-xl p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{selectedConvo.name}</h3>
              <button onClick={() => setSelectedConvo(null)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/50">
              <Phone className="h-3.5 w-3.5" />
              <span>{selectedLead.phone}</span>
            </div>

            <Badge variant="secondary">{selectedConvo.status}</Badge>

            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                <Phone className="h-3.5 w-3.5 mr-1" /> Call
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                <MessageCircle className="h-3.5 w-3.5 mr-1" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/5">
                <Mail className="h-3.5 w-3.5 mr-1" /> Email
              </Button>
            </div>

            {/* Last Message */}
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-xs text-white/40 mb-1">Last message · {selectedConvo.time}</p>
              <p className="text-sm text-white/70">{selectedConvo.lastMessage}</p>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h4 className="text-xs text-white/40 uppercase tracking-wider">Contact Details</h4>
              <div className="text-sm">
                <p className="text-white/60">Email: <span className="text-white/80">{selectedLead.email}</span></p>
                <p className="text-white/60">Budget: <span className="text-white/80">{selectedLead.budget_range}</span></p>
                <p className="text-white/60">Development: <span className="text-white/80">{selectedLead.development_name}</span></p>
                <p className="text-white/60">NB Score: <span className="text-emerald-400 font-bold">{selectedLead.ai_quality_score}</span></p>
              </div>
            </div>

            <Link
              href={`/demo/buyers/${selectedConvo.leadId}`}
              className="block text-center text-sm text-emerald-400 hover:text-emerald-300 py-2 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/5 transition-colors"
            >
              View Full Buyer Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
