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

// Expanded form data for multi-step onboarding
export interface OnboardingFormData {
  // Step 1: Profile & Company
  userType: 'developer' | 'agent' | 'broker' | ''
  jobRole: 'operations' | 'marketing' | 'sales' | ''
  firstName: string
  lastName: string
  phone: string
  jobTitle: string
  companyName: string
  website: string
  // Step 2: Business Configuration
  // Developer-specific
  developments: DevelopmentFormData[]
  // Agent-specific
  geographicCoverage: string
  propertyTypes: string[]
  // Broker-specific
  specialisms: string[]
  // Step 3: Team Invites
  teamInvites: TeamInviteData[]
  // Step 4: CSV Import (handled separately via file upload)
  // Step 5: Lead Sources (handled separately)
}

export interface DevelopmentFormData {
  name: string
  city: string
  postcode: string
  priceFrom: string
  priceTo: string
  totalUnits: string
  bedroomMix: string
  completionStatus: string
}

export interface TeamInviteData {
  email: string
  role: 'sales' | 'marketing' | 'viewer'
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
  developments: [],
  geographicCoverage: '',
  propertyTypes: [],
  specialisms: [],
  teamInvites: [],
}

export const TOTAL_ONBOARDING_STEPS = 6

export const STEP_LABELS = [
  'Profile & Company',
  'Business Setup',
  'Team Invites',
  'Import Pipeline',
  'Lead Sources',
  'Complete',
]

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
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error fetching profile:', error)
    }
    return null
  }

  return data
}

export async function createUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: user.email,
      onboarding_step: 1,
      onboarding_completed: false,
    })

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error creating profile:', error)
    }
    return null
  }

  const { data, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*, company:companies(*)')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error fetching created profile:', fetchError)
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error saving progress:', error)
    }
    return false
  }

  return true
}

export async function checkCompanyMatch(companyName: string): Promise<Company | null> {
  const supabase = createClient()

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, website, logo_url')
    .ilike('name', companyName.trim())
    .limit(1)

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error checking company match:', error)
    }
    return null
  }

  if (companies && companies.length > 0) {
    const company = companies[0]

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

export async function completeOnboardingWithExistingCompany(
  formData: OnboardingFormData,
  companyId: string
): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      email: user.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      job_title: formData.jobTitle || null,
      user_type: formData.userType,
      job_role: formData.jobRole || null,
      company_id: companyId,
      is_company_admin: false,
      membership_status: 'pending_approval',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error updating profile:', profileError)
    }
    return null
  }

  try {
    await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })
  } catch {
    // Non-blocking email resend
  }

  return getDashboardPath(formData.userType)
}

export async function completeOnboardingWithNewCompany(
  formData: OnboardingFormData
): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: newCompany, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: formData.companyName.trim(),
      website: formData.website
        ? (formData.website.startsWith('http')
            ? formData.website
            : `https://${formData.website}`)
        : null,
      tier: 'TRIAL',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (companyError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error creating company:', companyError)
    }
    return null
  }

  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({
      email: user.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      phone: formData.phone,
      job_title: formData.jobTitle || null,
      user_type: formData.userType,
      job_role: formData.jobRole || null,
      company_id: newCompany.id,
      is_company_admin: true,
      permission_role: 'owner',
      membership_status: 'active',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error updating profile:', profileError)
    }
    return null
  }

  try {
    await supabase.auth.resend({
      type: 'signup',
      email: user.email!,
    })
  } catch {
    // Non-blocking email resend
  }

  return getDashboardPath(formData.userType)
}

export async function createDevelopment(
  companyId: string,
  dev: DevelopmentFormData
): Promise<boolean> {
  const supabase = createClient()

  const priceFrom = dev.priceFrom ? parseFloat(dev.priceFrom.replace(/[^0-9.]/g, '')) : null
  const priceTo = dev.priceTo ? parseFloat(dev.priceTo.replace(/[^0-9.]/g, '')) : null
  const totalUnits = dev.totalUnits ? parseInt(dev.totalUnits, 10) : null

  const { error } = await supabase
    .from('developments')
    .insert({
      name: dev.name.trim(),
      location: dev.city.trim(),
      address: dev.postcode.trim(),
      company_id: companyId,
      price_from: priceFrom ? String(priceFrom) : null,
      price_to: priceTo ? String(priceTo) : null,
      total_units: totalUnits,
      units: totalUnits,
      description: dev.bedroomMix ? `Bedroom mix: ${dev.bedroomMix}` : null,
      status: dev.completionStatus || 'Active',
      availability_status: dev.completionStatus || 'Active',
    })

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error creating development:', error)
    }
    return false
  }

  return true
}

export async function sendTeamInvite(
  companyId: string,
  invite: TeamInviteData
): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from('company_invites')
    .insert({
      company_id: companyId,
      email: invite.email.trim().toLowerCase(),
      role: invite.role,
      invited_by: user.id,
      status: 'pending',
    })

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error sending invite:', error)
    }
    return false
  }

  return true
}

export async function generateApiKey(companyId: string): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const apiKey = `nb_${crypto.randomUUID().replace(/-/g, '')}`

  const { error } = await supabase
    .from('crm_integrations')
    .insert({
      company_id: companyId,
      integration_type: 'api_key',
      api_key: apiKey,
      status: 'active',
      created_by: user.id,
    })

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error generating API key:', error)
    }
    return null
  }

  return apiKey
}

export async function completeOnboarding(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { error } = await supabase
    .from('user_profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Onboarding] Error completing onboarding:', error)
    }
    return false
  }

  return true
}

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
    developments: [],
    geographicCoverage: '',
    propertyTypes: [],
    specialisms: [],
    teamInvites: [],
  }
}
