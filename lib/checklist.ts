import { createClient } from '@/lib/supabase/client'

export type UserType = 'developer' | 'agent' | 'broker'

export interface ChecklistItem {
  id: string
  label: string
  description: string
  href: string
  userTypes: UserType[] | 'all'
}

// Define all checklist items with their conditions
export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // All user types
  {
    id: 'complete_profile',
    label: 'Complete your profile',
    description: 'Add your name, phone, and company details',
    href: '/settings',
    userTypes: 'all',
  },
  {
    id: 'import_leads',
    label: 'Import your first leads',
    description: 'Upload a CSV or connect a lead source',
    href: '/buyers/import',
    userTypes: 'all',
  },
  {
    id: 'review_hot_lead',
    label: 'Review your first Hot Lead',
    description: 'View a lead detail page to see their full profile',
    href: '/buyers',
    userTypes: 'all',
  },
  {
    id: 'take_action',
    label: 'Take your first action',
    description: "Update a buyer's status to move them through your pipeline",
    href: '/buyers',
    userTypes: 'all',
  },
  {
    id: 'invite_team',
    label: 'Invite a team member',
    description: 'Add your team so they can see their priority leads',
    href: '/settings',
    userTypes: 'all',
  },
  // Developer-specific
  {
    id: 'add_development',
    label: 'Add your first development',
    description: 'Create a development to start receiving scored leads',
    href: '/developments',
    userTypes: ['developer'],
  },
  {
    id: 'connect_lead_source',
    label: 'Connect a lead source',
    description: 'Set up API integration or lead intake form',
    href: '/settings',
    userTypes: ['developer'],
  },
  // Agent-specific
  {
    id: 'connect_portal_feed',
    label: 'Connect portal feed',
    description: 'Integrate your portal to auto-import leads',
    href: '/settings',
    userTypes: ['agent'],
  },
  {
    id: 'score_portal_lead',
    label: 'Score your first portal lead',
    description: 'Import and score a lead from your portal feed',
    href: '/buyers',
    userTypes: ['agent'],
  },
  // Broker-specific
  {
    id: 'review_referral',
    label: 'Review your first referral lead',
    description: 'Check leads that have been routed to your company',
    href: '/borrowers',
    userTypes: ['broker'],
  },
]

export function getChecklistItemsForUser(userType: UserType): ChecklistItem[] {
  return CHECKLIST_ITEMS.filter(
    (item) => item.userTypes === 'all' || item.userTypes.includes(userType)
  ).map((item) => ({
    ...item,
    // Resolve relative paths based on user type
    href: resolveHref(item.href, userType),
  }))
}

function resolveHref(href: string, userType: UserType): string {
  const basePath = `/${userType}`
  // If href starts with /, it's relative to userType base path
  if (href.startsWith('/')) {
    return `${basePath}${href}`
  }
  return href
}

export interface ChecklistProgress {
  dismissed?: boolean
  viewed_lead?: boolean
  [key: string]: boolean | undefined
}

export async function checkItemCompletion(
  itemId: string,
  companyId: string,
  userId: string,
  userType: UserType,
  checklistProgress: ChecklistProgress
): Promise<boolean> {
  const supabase = createClient()

  switch (itemId) {
    case 'complete_profile': {
      const { data } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, phone, company_name')
        .eq('id', userId)
        .single()
      return !!(data?.first_name && data?.last_name && data?.phone && data?.company_name)
    }

    case 'import_leads': {
      const { count } = await supabase
        .from('buyers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
      return (count ?? 0) > 0
    }

    case 'review_hot_lead': {
      return checklistProgress.viewed_lead === true
    }

    case 'take_action': {
      // Check if user has updated a buyer's status at least once
      // We detect this by looking for buyers with status_last_modified set
      const { count } = await supabase
        .from('buyers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .not('status_last_modified', 'is', null)
      return (count ?? 0) > 0
    }

    case 'invite_team': {
      const { count } = await supabase
        .from('company_invites')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
      return (count ?? 0) > 0
    }

    case 'add_development': {
      const { count } = await supabase
        .from('developments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
      return (count ?? 0) > 0
    }

    case 'connect_lead_source': {
      const { count: crmCount } = await supabase
        .from('crm_integrations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
      return (crmCount ?? 0) > 0
    }

    case 'connect_portal_feed': {
      const { count } = await supabase
        .from('crm_integrations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
      return (count ?? 0) > 0
    }

    case 'score_portal_lead': {
      const { count } = await supabase
        .from('buyers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('data_source_primary', 'api')
      return (count ?? 0) > 0
    }

    case 'review_referral': {
      const { count } = await supabase
        .from('buyers')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
      return (count ?? 0) > 0
    }

    default:
      return false
  }
}

export async function updateChecklistProgress(
  userId: string,
  progress: ChecklistProgress
): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({
      checklist_progress: progress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Checklist] Error updating progress:', error)
    }
    return false
  }
  return true
}

export async function dismissChecklist(userId: string, currentProgress: ChecklistProgress): Promise<boolean> {
  return updateChecklistProgress(userId, { ...currentProgress, dismissed: true })
}

export async function reopenChecklist(userId: string, currentProgress: ChecklistProgress): Promise<boolean> {
  const { dismissed, ...rest } = currentProgress
  return updateChecklistProgress(userId, rest)
}
