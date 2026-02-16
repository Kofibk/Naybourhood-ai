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
  Upload,
  Plug,
  Clock,
  UserPlus,
  Plus,
  ChevronDown,
  ChevronRight,
  KeyRound,
  Receipt,
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { usePermissions } from '@/hooks/useCanAccess'
import { hasBillingAccess } from '@/lib/auth'
import type { Feature } from '@/types'

interface NavItem {
  name: string
  icon: React.ElementType
  href: string
  badge?: number
  feature?: Feature  // Feature required for this nav item
  comingSoon?: boolean  // Phase 5/6 placeholder
}

interface NavSection {
  label?: string  // Section heading (omit for ungrouped items)
  items: NavItem[]
}

export type UserType = 'admin' | 'developer' | 'agent' | 'broker'

interface SidebarProps {
  userType: UserType
  userName?: string
  userEmail?: string
  onLogout?: () => void
}

export function Sidebar({ userType, userName = 'User', userEmail, onLogout }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const basePath = `/${userType}`

  // Get user permissions for feature-based nav filtering
  const { permissions, isLoading: permissionsLoading } = usePermissions()

  // Check if user has billing access (using centralized auth config)
  const userHasBillingAccess = useMemo(() => {
    return hasBillingAccess(userEmail, permissions ? {
      isInternalTeam: permissions.isInternalTeam,
      isMasterAdmin: permissions.isMasterAdmin,
      permissions: permissions.permissions,
    } : undefined)
  }, [userEmail, permissions])

  // Check if a feature is accessible
  const canAccessFeature = useCallback((feature: Feature | undefined): boolean => {
    if (!feature) return true // No feature requirement = always show
    if (permissionsLoading) return true // Show while loading
    if (!permissions) return false
    if (permissions.isInternalTeam || permissions.isMasterAdmin) return true
    if (!permissions.enabledFeatures.includes(feature)) return false
    return permissions.permissions[feature]?.canRead ?? false
  }, [permissions, permissionsLoading])

  const getNavSections = useCallback((): NavSection[] => {
    if (userType === 'admin') {
      const adminItems: NavItem[] = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
        { name: 'Developments', icon: Home, href: '/admin/developments', feature: 'developments' },
        { name: 'Campaigns', icon: Megaphone, href: '/admin/campaigns', feature: 'campaigns' },
        { name: 'Leads', icon: Users, href: '/admin/leads', feature: 'leads' },
        { name: 'Borrowers', icon: Landmark, href: '/admin/borrowers', feature: 'borrowers' },
        { name: 'Conversations', icon: MessageSquare, href: '/admin/conversations', feature: 'conversations' },
        { name: 'Companies', icon: Building2, href: '/admin/companies', feature: 'team_management' },
        { name: 'Users', icon: UserCog, href: '/admin/users', feature: 'team_management' },
      ]

      if (userHasBillingAccess) {
        adminItems.push({ name: 'Billing', icon: CreditCard, href: '/admin/billing', feature: 'billing' })
      }

      adminItems.push(
        { name: 'Analytics', icon: BarChart3, href: '/admin/analytics', feature: 'analytics' },
        { name: 'Settings', icon: Settings, href: '/admin/settings', feature: 'settings' }
      )

      return [{ items: adminItems }]
    }

    if (userType === 'broker') {
      return [
        { items: [
          { name: 'Dashboard', icon: LayoutDashboard, href: basePath },
        ]},
        { label: 'Manage', items: [
          { name: 'Borrowers', icon: Landmark, href: `${basePath}/borrowers`, feature: 'borrowers' },
          { name: 'Conversations', icon: MessageSquare, href: `${basePath}/conversations`, feature: 'conversations' },
          { name: 'My Matches', icon: Heart, href: `${basePath}/matches`, feature: 'leads' },
        ]},
        { label: 'Engage', items: [
          { name: 'Campaigns', icon: Megaphone, href: `${basePath}/campaigns`, feature: 'campaigns' },
          { name: 'AI Insights', icon: Sparkles, href: `${basePath}/insights`, feature: 'ai_insights' },
        ]},
        { label: 'Settings', items: [
          { name: 'Settings', icon: Settings, href: `${basePath}/settings`, feature: 'settings' },
        ]},
      ]
    }

    // Developer and Agent — grouped sections with Coming Soon items
    return [
      { items: [
        { name: 'Dashboard', icon: LayoutDashboard, href: basePath },
      ]},
      { label: 'Buyers', items: [
        { name: 'All Buyers', icon: Users, href: `${basePath}/buyers`, feature: 'leads' },
        { name: 'Add Buyer', icon: UserPlus, href: `${basePath}/buyers/new`, feature: 'leads' },
        { name: 'Import CSV', icon: Upload, href: '#', feature: 'leads', comingSoon: true },
      ]},
      { label: 'Developments', items: [
        { name: 'All Developments', icon: Home, href: `${basePath}/developments`, feature: 'developments' },
        { name: 'Add Development', icon: Plus, href: `${basePath}/developments/new`, feature: 'developments' },
      ]},
      { label: 'Engage', items: [
        { name: 'Conversations', icon: MessageSquare, href: `${basePath}/conversations`, feature: 'conversations' },
        { name: 'My Matches', icon: Heart, href: `${basePath}/matches`, feature: 'leads' },
        { name: 'Campaigns', icon: Megaphone, href: `${basePath}/campaigns`, feature: 'campaigns' },
        { name: 'AI Insights', icon: Sparkles, href: `${basePath}/insights`, feature: 'ai_insights' },
        { name: 'Integrations', icon: Plug, href: '#', comingSoon: true },
      ]},
      { label: 'Settings', items: [
        { name: 'General', icon: Settings, href: `${basePath}/settings`, feature: 'settings' },
        { name: 'API Keys', icon: KeyRound, href: `${basePath}/settings/api-keys`, feature: 'settings' },
        { name: 'Billing', icon: Receipt, href: `${basePath}/settings/billing`, feature: 'settings' },
      ]},
    ]
  }, [userType, basePath, userHasBillingAccess])

  // Filter nav sections based on feature access
  const navSections = useMemo(() => {
    return getNavSections().map(section => ({
      ...section,
      items: section.items.filter(item => canAccessFeature(item.feature)),
    })).filter(section => section.items.length > 0)
  }, [getNavSections, canAccessFeature])

  // Flat list for backward compatibility (used by active check)
  const navItems = useMemo(() => {
    return navSections.flatMap(s => s.items)
  }, [navSections])

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
        <div className="space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={section.label || `section-${sIdx}`}>
              {section.label && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  {section.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.name}>
                    {item.comingSoon ? (
                      <span
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/30 cursor-default"
                        title="Coming Soon"
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0 text-white/20" aria-hidden="true" />
                        <span className="truncate">{item.name}</span>
                        <span className="ml-auto flex items-center gap-1 text-[10px] text-white/25">
                          <Clock className="h-3 w-3" />
                          Soon
                        </span>
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
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
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Quick Access - Admin Only */}
      {/* {userType === 'admin' && (
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
      )} */}

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
