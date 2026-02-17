import { createClient } from '@/lib/supabase/client'

export type NotificationType =
  | 'new_hot_lead'
  | 'score_change'
  | 'follow_up_overdue'
  | 'viewing_reminder'
  | 'user_join_request'
  | 'weekly_summary'
  | 'status_change'
  | 'team_invite_accepted'

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.actionUrl || null,
      read: false,
    })

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Notifications] Error creating notification:', error)
    }
    return false
  }

  return true
}

export async function createHotLeadNotification(
  userId: string,
  buyerName: string,
  buyerSummary: string,
  buyerId: string,
  userType: string
): Promise<boolean> {
  const basePath = userType === 'broker' ? `/${userType}/borrowers` : `/${userType}/buyers`

  return createNotification({
    userId,
    type: 'new_hot_lead',
    title: `New Hot Lead: ${buyerName}`,
    message: buyerSummary || 'A new high-priority lead has been identified.',
    actionUrl: `${basePath}/${buyerId}`,
  })
}

export async function createFollowUpOverdueNotification(
  userId: string,
  buyerName: string,
  buyerId: string,
  userType: string
): Promise<boolean> {
  const basePath = userType === 'broker' ? `/${userType}/borrowers` : `/${userType}/buyers`

  return createNotification({
    userId,
    type: 'follow_up_overdue',
    title: `Follow-up overdue: ${buyerName}`,
    message: 'This lead has not been contacted in over 3 days. Immediate action recommended.',
    actionUrl: `${basePath}/${buyerId}`,
  })
}
