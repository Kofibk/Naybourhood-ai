'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Building2,
  UserCog,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  MessageSquare,
  Heart,
  Home,
  Landmark,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  name: string
  icon: React.ElementType
  href: string
  badge?: number
}

export type UserType = 'admin' | 'developer' | 'agent' | 'broker'

interface SidebarProps {
  userType: UserType
  userName?: string
  onLogout?: () => void
}

export function Sidebar({ userType, userName = 'User', onLogout }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const basePath = `/${userType}`

  const getNavItems = (): NavItem[] => {
    if (userType === 'admin') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { name: 'Developments', icon: Home, href: '/admin/developments' },
        { name: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
        { name: 'Leads', icon: Users, href: '/admin/leads' },
        { name: 'Finance Leads', icon: Landmark, href: '/admin/finance-leads' },
        { name: 'Companies', icon: Building2, href: '/admin/companies' },
        { name: 'Users', icon: UserCog, href: '/admin/users' },
        { name: 'Billing', icon: CreditCard, href: '/admin/billing' },
        { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
        { name: 'Settings', icon: Settings, href: '/admin/settings' },
      ]
    }
    // Broker gets Finance Leads
    if (userType === 'broker') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: basePath },
        { name: 'Finance Leads', icon: Landmark, href: `${basePath}/finance-leads` },
        { name: 'Buyers', icon: Users, href: `${basePath}/buyers` },
        { name: 'Conversations', icon: MessageSquare, href: `${basePath}/conversations` },
        { name: 'My Matches', icon: Heart, href: `${basePath}/matches` },
        { name: 'AI Insights', icon: Sparkles, href: `${basePath}/insights` },
        { name: 'Settings', icon: Settings, href: `${basePath}/settings` },
      ]
    }
    // Developer and Agent
    return [
      { name: 'Dashboard', icon: LayoutDashboard, href: basePath },
      { name: 'Buyers', icon: Users, href: `${basePath}/buyers` },
      { name: 'Conversations', icon: MessageSquare, href: `${basePath}/conversations` },
      { name: 'My Matches', icon: Heart, href: `${basePath}/matches` },
      { name: 'Campaigns', icon: Megaphone, href: `${basePath}/campaigns` },
      { name: 'AI Insights', icon: Sparkles, href: `${basePath}/insights` },
      { name: 'Settings', icon: Settings, href: `${basePath}/settings` },
    ]
  }

  const navItems = getNavItems()
  const isActive = (href: string) => pathname === href

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/">
          <Logo variant="light" size="sm" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-sidebar-accent text-white font-medium'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
                {item.badge && (
                  <Badge variant="muted" className="ml-auto text-[10px]">
                    {item.badge.toLocaleString()}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md bg-sidebar-accent">
          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-sm font-medium">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{userType}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-3 left-3 z-50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 lg:transform-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <NavContent />
      </aside>
    </>
  )
}
