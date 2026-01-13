import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  user_type: 'developer' | 'agent' | 'broker' | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  job_title: string | null
  avatar_url: string | null
  company_id: string | null
  company_name: string | null
  company_logo_url: string | null
  website: string | null
  linkedin: string | null
  instagram: string | null
  business_address: string | null
  regions_covered: string[] | null
  goals: string[] | null
  requested_bespoke_campaign: boolean
  onboarding_step: number
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface OnboardingFormData {
  // Step 1
  userType: string
  // Step 2
  firstName: string
  lastName: string
  phone: string
  jobTitle: string
  avatarUrl: string
  // Step 3
  companyName: string
  companyLogoUrl: string
  website: string
  linkedin: string
  instagram: string
  businessAddress: string
  regionsCovered: string[]
  // Step 4
  teamEmails: string[]
  // Step 5
  goals: string[]
  // Step 6
  requestedBespokeCampaign: boolean
}

export const defaultFormData: OnboardingFormData = {
  userType: '',
  firstName: '',
  lastName: '',
  phone: '',
  jobTitle: '',
  avatarUrl: '',
  companyName: '',
  companyLogoUrl: '',
  website: '',
  linkedin: '',
  instagram: '',
  businessAddress: '',
  regionsCovered: [],
  teamEmails: [],
  goals: [],
  requestedBespokeCampaign: false,
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[Onboarding] Error fetching profile:', error)
    return null
  }

  return data
}

export async function createUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      onboarding_step: 1,
      onboarding_completed: false,
    })
    .select()
    .single()

  if (error) {
    console.error('[Onboarding] Error creating profile:', error)
    return null
  }

  return data
}

export async function saveOnboardingProgress(
  step: number,
  data: Partial<{
    user_type: string
    first_name: string
    last_name: string
    phone: string
    job_title: string
    avatar_url: string
    company_name: string
    company_logo_url: string
    website: string
    linkedin: string
    instagram: string
    business_address: string
    regions_covered: string[]
    goals: string[]
    requested_bespoke_campaign: boolean
    onboarding_completed: boolean
  }>
): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from('user_profiles')
    .update({
      ...data,
      onboarding_step: step,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[Onboarding] Error saving progress:', error)
    return false
  }

  return true
}

export async function saveTeamInvites(emails: string[]): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || emails.length === 0) return true

  // Get user's profile to determine their company and role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('company_name, user_type')
    .eq('id', user.id)
    .single()

  // Send actual email invitations for each team member
  const results = await Promise.all(
    emails.map(async (email) => {
      const trimmedEmail = email.trim().toLowerCase()
      try {
        const response = await fetch('/api/users/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: trimmedEmail,
            name: trimmedEmail.split('@')[0], // Use email prefix as placeholder name
            role: profile?.user_type || 'developer',
            is_internal: true, // Team members are internal
            inviter_role: 'admin', // Allow invite during onboarding
          }),
        })

        const result = await response.json()
        if (!result.success) {
          console.warn('[Onboarding] Invite failed for', trimmedEmail, ':', result.error)
        }
        return { email: trimmedEmail, success: result.success, error: result.error }
      } catch (err) {
        console.error('[Onboarding] Error sending invite to', trimmedEmail, ':', err)
        return { email: trimmedEmail, success: false, error: 'Network error' }
      }
    })
  )

  // Also save to team_invites table for tracking
  const invites = emails.map(email => ({
    invited_by: user.id,
    email: email.trim().toLowerCase(),
    status: 'pending',
  }))

  const { error } = await supabase
    .from('team_invites')
    .insert(invites)

  if (error) {
    console.error('[Onboarding] Error saving invites to table:', error)
    // Don't fail completely - emails may have been sent
  }

  // Log results
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length
  console.log(`[Onboarding] Team invites: ${successCount} sent, ${failCount} failed`)

  return successCount > 0 || failCount === 0
}

export async function completeOnboarding(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  // Fetch the user's profile to get company details
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('company_name, website, business_address, user_type, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[Onboarding] Error fetching profile:', profileError)
    return false
  }

  // Create the company if company_name exists
  let companyId: string | null = null

  if (profile?.company_name) {
    // Map user_type to company type (capitalize first letter)
    const companyType = profile.user_type
      ? profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)
      : 'Developer'

    // Get contact info from user's email
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const contactName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || null
    const contactEmail = authUser?.email || null

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: profile.company_name,
        type: companyType as 'Developer' | 'Agent' | 'Broker' | 'Marketing Agency' | 'Financial Advisor',
        website: profile.website || null,
        business_address: profile.business_address || null,
        contact_name: contactName,
        contact_email: contactEmail,
        status: 'Active',
      })
      .select('id')
      .single()

    if (companyError) {
      console.error('[Onboarding] Error creating company:', companyError)
      return false
    }

    companyId = company.id
  }

  // Update user_profiles with company_id and mark onboarding as completed
  const { error } = await supabase
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      ...(companyId && { company_id: companyId }),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[Onboarding] Error completing onboarding:', error)
    return false
  }

  return true
}

export function profileToFormData(profile: UserProfile): OnboardingFormData {
  return {
    userType: profile.user_type || '',
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    phone: profile.phone || '',
    jobTitle: profile.job_title || '',
    avatarUrl: profile.avatar_url || '',
    companyName: profile.company_name || '',
    companyLogoUrl: profile.company_logo_url || '',
    website: profile.website || '',
    linkedin: profile.linkedin || '',
    instagram: profile.instagram || '',
    businessAddress: profile.business_address || '',
    regionsCovered: profile.regions_covered || [],
    teamEmails: [],
    goals: profile.goals || [],
    requestedBespokeCampaign: profile.requested_bespoke_campaign || false,
  }
}
