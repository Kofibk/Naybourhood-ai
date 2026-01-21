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
  ArrowRightLeft,
  Shield,
  Briefcase,
  HardHat,
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
  userEmail?: string
  onLogout?: () => void
}

// Admins with billing access - add emails here
const BILLING_ACCESS_EMAILS = [
  'kofi@naybourhood.ai',
]

export function Sidebar({ userType, userName = 'User', userEmail, onLogout }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const basePath = `/${userType}`

  // Check if user has billing access
  const hasBillingAccess = userEmail && BILLING_ACCESS_EMAILS.includes(userEmail.toLowerCase())

  const getNavItems = (): NavItem[] => {
    if (userType === 'admin') {
      const adminItems: NavItem[] = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { name: 'Developments', icon: Home, href: '/admin/developments' },
        { name: 'Campaigns', icon: Megaphone, href: '/admin/campaigns' },
        { name: 'Leads', icon: Users, href: '/admin/leads' },
        { name: 'Borrowers', icon: Landmark, href: '/admin/borrowers' },
        { name: 'Conversations', icon: MessageSquare, href: '/admin/conversations' },
        { name: 'Companies', icon: Building2, href: '/admin/companies' },
        { name: 'Users', icon: UserCog, href: '/admin/users' },
      ]

      // Only show billing for authorized admins
      if (hasBillingAccess) {
        adminItems.push({ name: 'Billing', icon: CreditCard, href: '/admin/billing' })
      }

      adminItems.push(
        { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
        { name: 'Settings', icon: Settings, href: '/admin/settings' }
      )

      return adminItems
    }
    // Broker gets Borrowers (finance leads) - dedicated to mortgages/finance
    if (userType === 'broker') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: basePath },
        { name: 'Borrowers', icon: Landmark, href: `${basePath}/borrowers` },
        { name: 'Conversations', icon: MessageSquare, href: `${basePath}/conversations` },
        { name: 'My Matches', icon: Heart, href: `${basePath}/matches` },
        { name: 'Campaigns', icon: Megaphone, href: `${basePath}/campaigns` },
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

  // Quick Access dashboards for admins
  const quickAccessDashboards = [
    { name: 'Admin', icon: Shield, href: '/admin', type: 'admin' as UserType },
    { name: 'Developer', icon: HardHat, href: '/developer', type: 'developer' as UserType },
    { name: 'Agent', icon: Users, href: '/agent', type: 'agent' as UserType },
    { name: 'Broker', icon: Briefcase, href: '/broker', type: 'broker' as UserType },
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/">
          <Logo variant="light" size="sm" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
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
                )} aria-hidden="true" />
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto text-[10px] bg-[#34D399]/20 text-[#34D399] border-0 shrink-0">
                    {item.badge.toLocaleString()}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Quick Access - Admin Only */}
      {userType === 'admin' && (
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 mb-2.5 text-[10px] font-semibold text-white/40 uppercase tracking-wider">
            <ArrowRightLeft className="h-3 w-3 flex-shrink-0" />
            <span>Quick Access</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickAccessDashboards.map((dashboard) => (
              <Link
                key={dashboard.type}
                href={dashboard.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-200',
                  userType === dashboard.type
                    ? 'bg-[#34D399]/15 text-[#34D399]'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                )}
              >
                <dashboard.icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{dashboard.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-[#171717]">
          <div className="h-10 w-10 rounded-full bg-[#34D399]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-[#34D399]">
              {userName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-white/50 capitalize">{userType}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-white/60 hover:text-red-400 hover:bg-red-400/10 px-3"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4 mr-3 flex-shrink-0" />
          <span>Logout</span>
        </Button>
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
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        role="navigation"
        aria-label="Main navigation"
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
