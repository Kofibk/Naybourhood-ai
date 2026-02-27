'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/gcpdemo/dashboard' },
  { name: 'Building', icon: Building2, href: '/gcpdemo/building' },
  { name: 'Enquirers', icon: Users, href: '/gcpdemo/enquirers' },
  { name: 'Conversations', icon: MessageSquare, href: '/gcpdemo/conversations' },
  { name: 'Insights', icon: BarChart3, href: '/gcpdemo/insights' },
  { name: 'Settings', icon: Settings, href: '/gcpdemo/settings' },
]

interface GcpSidebarProps {
  onLogout?: () => void
}

export function GcpSidebar({ onLogout }: GcpSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Logo + Client */}
      <div className="p-4 border-b border-white/10">
        <Link href="/gcpdemo/dashboard">
          <Logo variant="light" size="sm" />
        </Link>
        <div className="mt-3 px-1">
          <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-white/40">Client</p>
          <p className="text-sm font-medium text-white mt-0.5">Aroundtown S.A.</p>
          <p className="text-xs text-white/50">London Kensington</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive(item.href)
                    ? 'bg-[#34D399]/15 text-[#34D399] shadow-sm'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive(item.href) ? 'text-[#34D399]' : 'text-white/50'
                )} />
                <span className="truncate">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#171717]">
          <div className="h-10 w-10 rounded-full bg-[#34D399]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-[#34D399]">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Demo User</p>
            <p className="text-xs text-white/50">demo@aroundtown.de</p>
          </div>
        </div>
        {onLogout && (
          <Button
            variant="ghost"
            className="w-full justify-start text-white/60 hover:text-red-400 hover:bg-red-400/10 px-3"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-3 left-3 z-50 bg-[#171717] border-white/10 text-white shadow-lg hover:bg-[#171717]/80"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 lg:transform-none border-r border-white/10',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <NavContent />
      </aside>
    </>
  )
}
