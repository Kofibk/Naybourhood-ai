'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ALL_ENQUIRERS } from '@/lib/gcpdemo'
import {
  Search,
  Phone,
  MessageCircle,
  Mail,
  ChevronRight,
  X,
} from 'lucide-react'

const GCP_DEMO_CONVERSATIONS = [
  {
    enquirerId: 'enq-marcus-weber',
    name: 'Marcus Weber',
    channel: 'email',
    lastMessage: 'Good morning. I have reviewed the tenancy agreement for Unit 1A. Everything looks in order. Could you confirm the move-in date as 1st March and the deposit amount?',
    time: '20 min ago',
    status: 'Verified',
    unread: true,
  },
  {
    enquirerId: 'enq-sophie-chen',
    name: 'Sophie Chen',
    channel: 'whatsapp',
    lastMessage: 'Hi, I visited the 2-bed in Unit 3B yesterday. Lovely flat. I would like to proceed with the application. What documents do you need from me?',
    time: '1h ago',
    status: 'Viewing Complete',
    unread: true,
  },
  {
    enquirerId: 'enq-amara-osei',
    name: 'Amara Osei',
    channel: 'phone',
    lastMessage: 'Call completed — 14 min. Discussed Unit 2C options and rent terms. Sending application form and reference request via email.',
    time: '3h ago',
    status: 'Viewing Booked',
    unread: false,
  },
  {
    enquirerId: 'enq-james-okafor',
    name: 'James Okafor',
    channel: 'whatsapp',
    lastMessage: 'Thanks for the floor plan. The 1-bed at Unit 4A looks perfect for my needs. I can do a viewing this Saturday if available?',
    time: '5h ago',
    status: 'Scored',
    unread: false,
  },
  {
    enquirerId: 'enq-raj-kapoor',
    name: 'Raj Kapoor',
    channel: 'email',
    lastMessage: 'I work at Imperial NHS Trust and need a flat close to the hospital. Do you have anything available from next month? My budget is up to £2,000 PCM.',
    time: 'Yesterday',
    status: 'Scored',
    unread: false,
  },
  {
    enquirerId: 'enq-li-mei-wong',
    name: 'Li Mei Wong',
    channel: 'whatsapp',
    lastMessage: 'Following up on the 1-bed near Kensington High Street. I work at Burberry HQ nearby so the location would be ideal. Can we arrange a viewing?',
    time: 'Yesterday',
    status: 'Viewing Booked',
    unread: false,
  },
  {
    enquirerId: 'enq-tom-richards',
    name: 'Tom Richards',
    channel: 'phone',
    lastMessage: 'Missed call. Left voicemail asking about studio availability and whether a 6-month tenancy is possible.',
    time: '2d ago',
    status: 'Flagged',
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

export default function GCPDemoConversationsPage() {
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selectedConvo, setSelectedConvo] = useState<typeof GCP_DEMO_CONVERSATIONS[0] | null>(null)

  const filtered = GCP_DEMO_CONVERSATIONS.filter((c) => {
    const matchesSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
    const matchesChannel = channelFilter === 'all' || c.channel === channelFilter
    return matchesSearch && matchesChannel
  })

  const selectedEnquirer = selectedConvo ? ALL_ENQUIRERS.find(e => e.id === selectedConvo.enquirerId) : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Conversations</h2>
        <p className="text-sm text-white/50">Manage applicant communications</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-white">{GCP_DEMO_CONVERSATIONS.length}</p>
          <p className="text-[10px] text-white/40 uppercase">Total</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-yellow-400">{GCP_DEMO_CONVERSATIONS.filter(c => c.unread).length}</p>
          <p className="text-[10px] text-white/40 uppercase">Unread</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{GCP_DEMO_CONVERSATIONS.filter(c => c.channel === 'whatsapp').length}</p>
          <p className="text-[10px] text-white/40 uppercase">WhatsApp</p>
        </div>
        <div className="bg-[#111111] border border-white/10 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{GCP_DEMO_CONVERSATIONS.filter(c => c.channel === 'phone').length}</p>
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
                key={convo.enquirerId}
                onClick={() => setSelectedConvo(convo)}
                className={`bg-[#111111] border rounded-xl p-4 cursor-pointer transition-colors ${
                  selectedConvo?.enquirerId === convo.enquirerId
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
        {selectedConvo && selectedEnquirer && (
          <div className="w-1/2 bg-[#111111] border border-white/10 rounded-xl p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">{selectedConvo.name}</h3>
              <button onClick={() => setSelectedConvo(null)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/50">
              <Phone className="h-3.5 w-3.5" />
              <span>{selectedEnquirer.phone}</span>
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
                <p className="text-white/60">Email: <span className="text-white/80">{selectedEnquirer.email}</span></p>
                <p className="text-white/60">Employer: <span className="text-white/80">{selectedEnquirer.employer}</span></p>
                <p className="text-white/60">Role: <span className="text-white/80">{selectedEnquirer.role}</span></p>
                <p className="text-white/60">NB Score: <span className="text-emerald-400 font-bold">{selectedEnquirer.aiScore}</span></p>
              </div>
            </div>

            <Link
              href={`/gcpdemo/enquirers/${selectedConvo.enquirerId}`}
              className="block text-center text-sm text-emerald-400 hover:text-emerald-300 py-2 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/5 transition-colors"
            >
              View Full Enquirer Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
