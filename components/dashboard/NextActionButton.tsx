'use client'

import { cn } from '@/lib/utils'
import { Phone, Mail, MessageCircle, Calendar, UserCheck, RotateCw, Eye } from 'lucide-react'

interface NextActionButtonProps {
  action: string
  onClick?: (e: React.MouseEvent) => void
  size?: 'sm' | 'md'
}

const ACTION_CONFIG: Record<string, { icon: typeof Phone; label: string; color: string }> = {
  'call': { icon: Phone, label: 'Call', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' },
  'phone': { icon: Phone, label: 'Call', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' },
  'email': { icon: Mail, label: 'Send Email', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20' },
  'whatsapp': { icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' },
  'Schedule Viewing': { icon: Calendar, label: 'Schedule Viewing', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20' },
  'book_viewing': { icon: Calendar, label: 'Book Viewing', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20' },
  'Send Brochure': { icon: Mail, label: 'Send Brochure', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20' },
  'Qualify via WhatsApp': { icon: MessageCircle, label: 'Qualify via WhatsApp', color: 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' },
  'follow_up': { icon: RotateCw, label: 'Follow Up', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' },
  'confirm': { icon: UserCheck, label: 'Confirm', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' },
  're_engage': { icon: RotateCw, label: 'Re-engage', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20' },
}

function getConfig(action: string) {
  // Exact match first
  if (ACTION_CONFIG[action]) return ACTION_CONFIG[action]

  // Keyword match
  const lower = action.toLowerCase()
  if (lower.includes('call') || lower.includes('phone')) return ACTION_CONFIG['call']
  if (lower.includes('whatsapp')) return ACTION_CONFIG['whatsapp']
  if (lower.includes('email') || lower.includes('brochure') || lower.includes('send')) return ACTION_CONFIG['email']
  if (lower.includes('viewing') || lower.includes('schedule') || lower.includes('book')) return ACTION_CONFIG['book_viewing']
  if (lower.includes('follow')) return ACTION_CONFIG['follow_up']
  if (lower.includes('qualify') || lower.includes('confirm')) return ACTION_CONFIG['confirm']

  // Default
  return { icon: Eye, label: action, color: 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10' }
}

export function NextActionButton({ action, onClick, size = 'sm' }: NextActionButtonProps) {
  const config = getConfig(action)
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border transition-colors font-medium',
        config.color,
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {config.label}
    </button>
  )
}
