'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Check, X, Flame, TrendingUp, Clock, UserPlus, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  action_url?: string
  created_at: string
}

const NOTIFICATION_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  new_hot_lead: { icon: Flame, color: 'text-red-400 bg-red-500/10' },
  score_change: { icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10' },
  follow_up_overdue: { icon: Clock, color: 'text-amber-400 bg-amber-500/10' },
  viewing_reminder: { icon: Clock, color: 'text-purple-400 bg-purple-500/10' },
  user_join_request: { icon: UserPlus, color: 'text-blue-400 bg-blue-500/10' },
  weekly_summary: { icon: BarChart3, color: 'text-cyan-400 bg-cyan-500/10' },
}

export function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.id) return

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, message, read, action_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (!error && data) {
        const typed = data as Notification[]
        setNotifications(typed)
        setUnreadCount(typed.filter((n) => !n.read).length)
      }
    } catch {
      // Notifications table may not exist yet
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (notificationId: string) => {
    if (!isSupabaseConfigured()) return

    try {
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Ignore errors
    }
  }

  const markAllAsRead = async () => {
    if (!isSupabaseConfigured() || !user?.id) return

    try {
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // Ignore errors
    }
  }

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <Bell className="w-5 h-5 text-white/60" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const iconConfig = NOTIFICATION_ICONS[notification.type] || {
                  icon: Bell,
                  color: 'text-white/40 bg-white/5',
                }
                const Icon = iconConfig.icon

                const content = (
                  <div
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      !notification.read && 'bg-white/[0.02]',
                      'hover:bg-white/5'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', iconConfig.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', notification.read ? 'text-white/60' : 'text-white font-medium')}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5 truncate">{notification.message}</p>
                      <p className="text-[10px] text-white/30 mt-1">{formatTime(notification.created_at)}</p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        className="p-1 text-white/20 hover:text-white/40 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )

                if (notification.action_url) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.action_url}
                      onClick={() => {
                        markAsRead(notification.id)
                        setIsOpen(false)
                      }}
                    >
                      {content}
                    </Link>
                  )
                }

                return <div key={notification.id}>{content}</div>
              })
            ) : (
              <div className="text-center py-8 text-white/30">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
