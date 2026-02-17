export type NotificationType =
  | 'new_hot_lead'
  | 'score_change'
  | 'follow_up_overdue'
  | 'viewing_reminder'
  | 'user_join_request'
  | 'weekly_summary'
  | 'status_change'
  | 'team_invite_accepted'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  action_url?: string
  created_at: string
}
