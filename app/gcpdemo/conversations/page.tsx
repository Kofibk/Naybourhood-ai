'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { DEMO_CONVERSATIONS } from '@/lib/gcpdemo'
import type { DemoConversation } from '@/lib/gcpdemo/types'
import { MessageSquare, Bot, User, CheckCircle2, AlertTriangle, XCircle, Filter } from 'lucide-react'

function ConversationList({ conversations, selectedId, onSelect }: {
  conversations: DemoConversation[]
  selectedId: string | null
  onSelect: (c: DemoConversation) => void
}) {
  return (
    <div className="space-y-1">
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={`w-full text-left p-3 rounded-lg transition-colors ${
            selectedId === conv.id ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-white/[0.03] border border-transparent'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white">{conv.enquirerName}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              conv.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
              conv.status === 'Flagged' ? 'bg-red-500/20 text-red-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>{conv.status}</span>
          </div>
          <p className="text-xs text-white/40 truncate">
            {conv.messages[conv.messages.length - 1]?.content.slice(0, 60)}...
          </p>
          <p className="text-[10px] text-white/30 mt-1">
            {conv.messages.length} messages · Score: {conv.outcome.score}
          </p>
        </button>
      ))}
    </div>
  )
}

function ConversationThread({ conversation }: { conversation: DemoConversation }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">{conversation.enquirerName}</h3>
            <p className="text-xs text-white/40">
              {new Date(conversation.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {' · '}{conversation.messages.length} messages
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            conversation.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-red-500/20 text-red-400'
          }`}>{conversation.status}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {conversation.messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'ai' ? '' : 'flex-row-reverse'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender === 'ai' ? 'bg-blue-500/20' : 'bg-white/10'
            }`}>
              {msg.sender === 'ai' ? (
                <Bot className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-white/60" />
              )}
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.sender === 'ai'
                ? 'bg-[#111111] border border-white/10'
                : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}>
              <p className="text-sm text-white/80 leading-relaxed">{msg.content}</p>
              <p className="text-[10px] text-white/30 mt-1.5">
                {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Outcome Assessment */}
        <div className="mt-6 bg-[#111111] border border-white/10 rounded-xl p-5">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">OUTCOME ASSESSMENT</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className={`text-3xl font-bold ${
                conversation.outcome.score >= 70 ? 'text-emerald-400' :
                conversation.outcome.score >= 45 ? 'text-amber-400' : 'text-gray-400'
              }`}>{conversation.outcome.score}</p>
              <p className="text-[10px] text-white/40 uppercase">{conversation.outcome.category}</p>
            </div>
          </div>
          <div className="space-y-2">
            {conversation.outcome.lines.map((line, i) => (
              <div key={i} className="flex items-start gap-2.5">
                {line.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : line.status === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <span className="text-sm text-white/70">{line.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConversationsPage() {
  const searchParams = useSearchParams()
  const initialId = searchParams.get('id')
  const [filter, setFilter] = useState<'all' | 'Completed' | 'Flagged'>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return DEMO_CONVERSATIONS
    return DEMO_CONVERSATIONS.filter(c => c.status === filter)
  }, [filter])

  const initialConversation = initialId ? DEMO_CONVERSATIONS.find(c => c.id === initialId) : null
  const [selected, setSelected] = useState<DemoConversation | null>(initialConversation || filtered[0] || null)

  return (
    <div className="flex gap-0 h-[calc(100vh-73px)] -m-4 lg:-m-6">
      {/* Left: Conversation List */}
      <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#0A0A0A]">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">Conversations</span>
            <span className="text-xs text-white/40 ml-auto">{filtered.length}</span>
          </div>
          <div className="flex gap-1 mt-3">
            {(['all', 'Completed', 'Flagged'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                  filter === f
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ConversationList
            conversations={filtered}
            selectedId={selected?.id || null}
            onSelect={setSelected}
          />
        </div>
      </div>

      {/* Right: Message Thread */}
      <div className="flex-1 bg-[#0A0A0A]">
        {selected ? (
          <ConversationThread conversation={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            Select a conversation to view
          </div>
        )}
      </div>
    </div>
  )
}
