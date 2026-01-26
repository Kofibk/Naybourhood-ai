'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isMasterAdmin, isInternalTeamEmail, hasFullAccess } from '@/lib/auth'
import type { Feature, FeaturePermission, PermissionRole, UserPermissions } from '@/types'

// Default permissions for each role (matches database seed)
const DEFAULT_ROLE_PERMISSIONS: Record<PermissionRole, Record<Feature, FeaturePermission>> = {
  owner: {
    leads: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    campaigns: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    developments: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    conversations: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    analytics: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    reports: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    borrowers: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    ai_insights: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    billing: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    team_management: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    settings: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
  },
  admin: {
    leads: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    campaigns: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    developments: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    conversations: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    analytics: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    reports: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    borrowers: { canRead: true, canCreate: true, canUpdate: true, canDelete: true },
    ai_insights: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    billing: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    team_management: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    settings: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
  },
  sales: {
    leads: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    campaigns: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    developments: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    conversations: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    analytics: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    reports: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    borrowers: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    ai_insights: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    billing: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
    team_management: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
    settings: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  },
  marketing: {
    leads: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    campaigns: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    developments: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    conversations: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    analytics: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    reports: { canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    borrowers: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
    ai_insights: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    billing: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
    team_management: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
    settings: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  },
  viewer: {
    leads: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    campaigns: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    developments: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    conversations: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    analytics: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    reports: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    borrowers: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    ai_insights: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
    billing: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
    team_management: { canRead: false, canCreate: false, canUpdate: false, canDelete: false },
    settings: { canRead: true, canCreate: false, canUpdate: false, canDelete: false },
  },
}

// Full access permissions (for internal team)
const FULL_ACCESS: FeaturePermission = {
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
}

// No access permissions
const NO_ACCESS: FeaturePermission = {
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
}

interface UseCanAccessResult extends FeaturePermission {
  canAccess: boolean  // Shorthand for canRead
  isLoading: boolean
  error: string | null
}

interface UsePermissionsResult {
  permissions: UserPermissions | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to get the current user's full permissions
 */
export function usePermissions(): UsePermissionsResult {
  const { user, isLoading: authLoading } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions(null)
      setIsLoading(false)
      return
    }

    // Check if user is internal team or master admin (using centralized auth config)
    const userIsInternalTeam = user.is_internal || isInternalTeamEmail(user.email)
    const userIsMasterAdmin = user.is_master_admin || isMasterAdmin(user.email)

    // Internal team gets full access to everything
    if (userIsInternalTeam || userIsMasterAdmin) {
      const fullPermissions: UserPermissions = {
        role: 'owner',
        companyId: user.company_id || null,
        enabledFeatures: Object.keys(DEFAULT_ROLE_PERMISSIONS.owner) as Feature[],
        permissions: DEFAULT_ROLE_PERMISSIONS.owner,
        isInternalTeam: true,
        isMasterAdmin: userIsMasterAdmin,
      }
      setPermissions(fullPermissions)
      setIsLoading(false)
      return
    }

    // For regular users, fetch company features and user role from database
    if (!isSupabaseConfigured()) {
      // Fallback for demo mode
      const role = (user.permission_role || 'viewer') as PermissionRole
      setPermissions({
        role,
        companyId: user.company_id || null,
        enabledFeatures: ['leads', 'campaigns', 'developments', 'conversations'],
        permissions: DEFAULT_ROLE_PERMISSIONS[role],
        isInternalTeam: false,
        isMasterAdmin: false,
      })
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Fetch user profile with company data
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          permission_role,
          company_id,
          is_internal_team,
          company:companies(
            id,
            name,
            enabled_features
          )
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('[usePermissions] Profile fetch error:', profileError)
        setError(profileError.message)
        setIsLoading(false)
        return
      }

      const role = (profile?.permission_role || 'viewer') as PermissionRole
      const company = profile?.company as { id: string; name: string; enabled_features: Feature[] } | null
      const enabledFeatures = company?.enabled_features || ['leads', 'campaigns', 'developments', 'conversations']

      // Build permissions object - only include enabled features
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role]
      const effectivePermissions: Record<Feature, FeaturePermission> = {} as Record<Feature, FeaturePermission>

      for (const feature of Object.keys(rolePermissions) as Feature[]) {
        if (enabledFeatures.includes(feature)) {
          effectivePermissions[feature] = rolePermissions[feature]
        } else {
          effectivePermissions[feature] = NO_ACCESS
        }
      }

      setPermissions({
        role,
        companyId: company?.id || null,
        enabledFeatures,
        permissions: effectivePermissions,
        isInternalTeam: profile?.is_internal_team || false,
        isMasterAdmin: false,
      })
      setError(null)
    } catch (err) {
      console.error('[usePermissions] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchPermissions()
    }
  }, [authLoading, fetchPermissions])

  return {
    permissions,
    isLoading: authLoading || isLoading,
    error,
    refetch: fetchPermissions,
  }
}

/**
 * Hook to check if the current user can access a specific feature
 * @param feature - The feature to check access for
 * @returns Object with canAccess, canRead, canCreate, canUpdate, canDelete booleans
 */
export function useCanAccess(feature: Feature): UseCanAccessResult {
  const { permissions, isLoading, error } = usePermissions()

  const result = useMemo(() => {
    if (!permissions) {
      return {
        canAccess: false,
        ...NO_ACCESS,
        isLoading,
        error,
      }
    }

    // Internal team gets full access
    if (permissions.isInternalTeam || permissions.isMasterAdmin) {
      return {
        canAccess: true,
        ...FULL_ACCESS,
        isLoading,
        error,
      }
    }

    // Check if company has feature enabled
    if (!permissions.enabledFeatures.includes(feature)) {
      return {
        canAccess: false,
        ...NO_ACCESS,
        isLoading,
        error: 'Feature not enabled for your company',
      }
    }

    const featurePermission = permissions.permissions[feature] || NO_ACCESS

    return {
      canAccess: featurePermission.canRead,
      ...featurePermission,
      isLoading,
      error,
    }
  }, [permissions, feature, isLoading, error])

  return result
}

/**
 * Hook to check multiple features at once
 * @param features - Array of features to check
 * @returns Record of feature -> permissions
 */
export function useCanAccessMultiple(features: Feature[]): Record<Feature, UseCanAccessResult> {
  const { permissions, isLoading, error } = usePermissions()

  return useMemo(() => {
    const result: Record<Feature, UseCanAccessResult> = {} as Record<Feature, UseCanAccessResult>

    for (const feature of features) {
      if (!permissions) {
        result[feature] = {
          canAccess: false,
          ...NO_ACCESS,
          isLoading,
          error,
        }
        continue
      }

      if (permissions.isInternalTeam || permissions.isMasterAdmin) {
        result[feature] = {
          canAccess: true,
          ...FULL_ACCESS,
          isLoading,
          error,
        }
        continue
      }

      if (!permissions.enabledFeatures.includes(feature)) {
        result[feature] = {
          canAccess: false,
          ...NO_ACCESS,
          isLoading,
          error: 'Feature not enabled',
        }
        continue
      }

      const featurePermission = permissions.permissions[feature] || NO_ACCESS
      result[feature] = {
        canAccess: featurePermission.canRead,
        ...featurePermission,
        isLoading,
        error,
      }
    }

    return result
  }, [permissions, features, isLoading, error])
}

/**
 * Helper to check if user can access a specific route
 * @param pathname - The route pathname to check
 * @returns Whether user can access the route
 */
export function useCanAccessRoute(pathname: string): { canAccess: boolean; isLoading: boolean } {
  const { permissions, isLoading } = usePermissions()

  return useMemo(() => {
    if (isLoading || !permissions) {
      return { canAccess: false, isLoading }
    }

    // Internal team can access everything
    if (permissions.isInternalTeam || permissions.isMasterAdmin) {
      return { canAccess: true, isLoading: false }
    }

    // Import FEATURE_ROUTES from types - check if route matches any enabled feature
    const { FEATURE_ROUTES } = require('@/types')

    for (const [feature, routes] of Object.entries(FEATURE_ROUTES) as [Feature, string[]][]) {
      if (routes.some(route => pathname.startsWith(route))) {
        // Route belongs to this feature - check if user has access
        if (!permissions.enabledFeatures.includes(feature)) {
          return { canAccess: false, isLoading: false }
        }
        if (!permissions.permissions[feature]?.canRead) {
          return { canAccess: false, isLoading: false }
        }
        return { canAccess: true, isLoading: false }
      }
    }

    // Route not mapped to any feature - allow access (likely a public route)
    return { canAccess: true, isLoading: false }
  }, [permissions, pathname, isLoading])
}
