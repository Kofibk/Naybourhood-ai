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
  FileSpreadsheet,
  GitBranch,
  Target,
  Rocket,
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
  subItems?: { name: string; icon: React.ElementType; href: string }[]
}

export type UserType = 'admin' | 'developer' | 'agent' | 'broker'

interface SidebarProps {
  userType: UserType
  userName?: string
  userEmail?: string
  onLogout?: () => void
  showSetupGuide?: boolean
  onReopenChecklist?: () => void
}

export function Sidebar({ userType, userName = 'User', userEmail, onLogout, showSetupGuide, onReopenChecklist }: SidebarProps) {
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

  const getNavItems = useCallback((): NavItem[] => {
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

      // Only show billing for authorized admins
      if (userHasBillingAccess) {
        adminItems.push({ name: 'Billing', icon: CreditCard, href: '/admin/billing', feature: 'billing' })
      }

      adminItems.push(
        { name: 'Analytics', icon: BarChart3, href: '/admin/analytics', feature: 'analytics' },
        { name: 'Settings', icon: Settings, href: '/admin/settings' }
      )

      return adminItems
    }
    // Broker gets Borrowers (finance leads) - dedicated to mortgages/finance
    if (userType === 'broker') {
      return [
        { name: 'Dashboard', icon: LayoutDashboard, href: basePath },
        { name: 'Borrowers', icon: Landmark, href: `${basePath}/borrowers`, feature: 'borrowers' },
        { name: 'Pipeline', icon: GitBranch, href: `${basePath}/pipeline`, feature: 'leads' },
        { name: 'Outcomes', icon: Target, href: `${basePath}/outcomes`, feature: 'leads' },
        { name: 'Conversations', icon: MessageSquare, href: `${basePath}/conversations`, feature: 'conversations' },
        { name: 'Campaigns', icon: Megaphone, href: `${basePath}/campaigns`, feature: 'campaigns' },
        { name: 'AI Insights', icon: Sparkles, href: `${basePath}/insights`, feature: 'ai_insights' },
        { name: 'Settings', icon: Settings, href: `${basePath}/settings` },
      ]
    }
    // Developer and Agent - include Developments
    return [
      { name: 'Dashboard', icon: LayoutDashboard, href: basePath },
      { name: 'Developments', icon: Home, href: `${basePath}/developments`, feature: 'developments' },
      {
        name: 'Buyers',
        icon: Users,
        href: `${basePath}/buyers`,
        feature: 'leads',
        subItems: [
          { name: 'CSV Import', icon: FileSpreadsheet, href: `${basePath}/buyers/import` },
        ],
      },
      { name: 'Pipeline', icon: GitBranch, href: `${basePath}/pipeline`, feature: 'leads' },
      { name: 'Outcomes', icon: Target, href: `${basePath}/outcomes`, feature: 'leads' },
      { name: 'Conversations', icon: MessageSquare, href: `${basePath}/conversations`, feature: 'conversations' },
      { name: 'Campaigns', icon: Megaphone, href: `${basePath}/campaigns`, feature: 'campaigns' },
      { name: 'AI Insights', icon: Sparkles, href: `${basePath}/insights`, feature: 'ai_insights' },
      { name: 'Settings', icon: Settings, href: `${basePath}/settings` },
    ]
  }, [userType, basePath, userHasBillingAccess])

  // Filter nav items based on feature access
  const navItems = useMemo(() => {
    return getNavItems().filter(item => canAccessFeature(item.feature))
  }, [getNavItems, canAccessFeature])

  const isActive = (href: string) => pathname === href
  const isActiveParent = (item: NavItem) =>
    pathname === item.href ||
    pathname.startsWith(item.href + '/') ||
    (item.subItems?.some(sub => pathname === sub.href) ?? false)

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
              {/* Sub-items */}
              {item.subItems && isActiveParent(item) && (
                <ul className="ml-8 mt-1 space-y-0.5">
                  {item.subItems.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive(sub.href) ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                          isActive(sub.href)
                            ? 'bg-[#34D399]/10 text-[#34D399]'
                            : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                        )}
                      >
                        <sub.icon className={cn(
                          'h-3.5 w-3.5 flex-shrink-0',
                          isActive(sub.href) ? 'text-[#34D399]' : 'text-white/40'
                        )} aria-hidden="true" />
                        <span className="truncate">{sub.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
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

      {/* Setup Guide - shown when checklist is dismissed */}
      {showSetupGuide && (
        <div className="px-3 py-2 border-t border-white/10">
          <button
            onClick={onReopenChecklist}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs font-medium text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all duration-200"
          >
            <Rocket className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Setup Guide</span>
          </button>
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
