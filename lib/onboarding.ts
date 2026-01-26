import { createClient } from '@/lib/supabase/client'

export interface Company {
  id: string
  name: string
  website: string | null
  logo_url?: string | null
  development_count?: number
}

export interface UserProfile {
  id: string
  user_type: 'developer' | 'agent' | 'broker' | null
  job_role: 'operations' | 'marketing' | 'sales' | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  job_title: string | null
  avatar_url: string | null
  company_id: string | null
  is_company_admin: boolean
  membership_status: 'pending_approval' | 'active' | 'rejected' | 'suspended'
  onboarding_step: number
  onboarding_completed: boolean
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
  // Joined company data
  company?: Company | null
}

// Simplified form data for 2-step onboarding
export interface OnboardingFormData {
  // Step 1: You
  userType: 'developer' | 'agent' | 'broker' | ''
  jobRole: 'operations' | 'marketing' | 'sales' | ''
  firstName: string
  lastName: string
  phone: string
  jobTitle: string
  // Step 2: Company
  companyName: string
  website: string
}

export const defaultFormData: OnboardingFormData = {
  userType: '',
  jobRole: '',
  firstName: '',
  lastName: '',
  phone: '',
  jobTitle: '',
  companyName: '',
  website: '',
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*, company:companies(*)')
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

  // First upsert the profile
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      onboarding_step: 1,
      onboarding_completed: false,
    })

  if (error) {
    console.error('[Onboarding] Error creating profile:', error)
    return null
  }

  // Fetch the profile with company data
  const { data, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    console.error('[Onboarding] Error fetching created profile:', fetchError)
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
    onboarding_completed: boolean
    onboarding_completed_at: string
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[Onboarding] Error saving progress:', error)
    return false
  }

  return true
}

/**
 * Check if a company with similar name exists
 * Called when user clicks "Next" on step 2
 */
export async function checkCompanyMatch(companyName: string): Promise<Company | null> {
  const supabase = createClient()

  // Case-insensitive search for exact or very similar match
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, website, logo_url')
    .ilike('name', companyName.trim())
    .limit(1)

  if (error) {
    console.error('[Onboarding] Error checking company match:', error)
    return null
  }

  if (companies && companies.length > 0) {
    const company = companies[0]

    // Get development count for the company
    const { count } = await supabase
      .from('developments')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)

    return {
      id: company.id,
      name: company.name,
      website: company.website,
      logo_url: company.logo_url,
      development_count: count || 0,
    }
  }

  return null
}

/**
 * Complete onboarding by joining an existing company
 * User gets pending_approval status - needs company admin approval
 */
export async function completeOnboardingWithExistingCompany(
  formData: OnboardingFormData,
  companyId: string
): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error('[Onboarding] Not authenticated')
    return null
  }

  // Update user profile - pending approval
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      job_title: formData.jobTitle || null,
      user_type: formData.userType,
      job_role: formData.jobRole || null,
      company_id: companyId,
      is_company_admin: false,
      membership_status: 'pending_approval',
      status: 'active',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('[Onboarding] Error updating profile:', profileError)
    return null
  }

  // Send verification email (non-blocking)
  try {
    await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })
  } catch (e) {
    console.warn('[Onboarding] Could not resend verification email:', e)
  }

  // Return dashboard path based on role
  return getDashboardPath(formData.userType)
}

/**
 * Complete onboarding by creating a new company
 * User becomes company admin with active status immediately
 */
export async function completeOnboardingWithNewCompany(
  formData: OnboardingFormData
): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.error('[Onboarding] Not authenticated')
    return null
  }

  // Create new company
  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: formData.companyName.trim(),
      website: formData.website
        ? (formData.website.startsWith('http')
            ? formData.website
            : `https://${formData.website}`)
        : null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (companyError) {
    console.error('[Onboarding] Error creating company:', companyError)
    return null
  }

  // Update user profile - active immediately as company admin
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      job_title: formData.jobTitle || null,
      user_type: formData.userType,
      job_role: formData.jobRole || null,
      company_id: newCompany.id,
      is_company_admin: true,
      membership_status: 'active',
      status: 'active',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('[Onboarding] Error updating profile:', profileError)
    return null
  }

  // Send verification email (non-blocking)
  try {
    await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })
  } catch (e) {
    console.warn('[Onboarding] Could not resend verification email:', e)
  }

  // Return dashboard path based on role
  return getDashboardPath(formData.userType)
}

/**
 * Get dashboard path based on user role
 */
export function getDashboardPath(role: string): string {
  const paths: Record<string, string> = {
    developer: '/developer',
    agent: '/agent',
    broker: '/broker',
    admin: '/admin',
    super_admin: '/admin',
  }
  return paths[role] || '/developer'
}

export function profileToFormData(profile: UserProfile): OnboardingFormData {
  return {
    userType: profile.user_type || '',
    jobRole: profile.job_role || '',
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    phone: profile.phone || '',
    jobTitle: profile.job_title || '',
    companyName: profile.company?.name || '',
    website: profile.company?.website || '',
  }
}
