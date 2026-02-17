import type { SupabaseClient } from '@supabase/supabase-js'

export async function trackOnboardingEvent(
  supabase: SupabaseClient,
  eventType: string,
  stepNumber?: number,
  metadata?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get company_id from user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    await supabase.from('onboarding_events').insert({
      user_id: user.id,
      company_id: profile?.company_id || null,
      event_type: eventType,
      step_number: stepNumber ?? null,
      metadata: metadata || {},
    })
  } catch {
    // Non-blocking: analytics should never break the user flow
    if (process.env.NODE_ENV === 'development') {
      console.error('[Analytics] Failed to track onboarding event:', eventType)
    }
  }
}

// Event type constants
export const ONBOARDING_EVENTS = {
  STARTED: 'onboarding_started',
  STEP_COMPLETED: 'step_completed',
  STEP_SKIPPED: 'step_skipped',
  COMPLETED: 'onboarding_completed',
  ABANDONED: 'onboarding_abandoned',
  CSV_IMPORT_STARTED: 'csv_import_started',
  CSV_IMPORT_COMPLETED: 'csv_import_completed',
  TEAM_INVITE_SENT: 'team_invite_sent',
  DEVELOPMENT_ADDED: 'development_added',
} as const
