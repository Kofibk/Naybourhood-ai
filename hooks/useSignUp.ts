'use client'

import { useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SignUpPayload {
  email: string
  password: string
  fullName: string
  companyName: string
  role: 'developer' | 'agent' | 'broker'
  companySize: string
}

interface SignUpResult {
  userId: string
  companyId: string
}

async function signUpUser(payload: SignUpPayload): Promise<SignUpResult> {
  const supabase = createClient()

  // 1. Create auth user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
        company_name: payload.companyName,
        role: payload.role,
      },
    },
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (!authData.user) {
    throw new Error('Sign up failed. Please try again.')
  }

  const userId = authData.user.id

  // 2. Create company record
  const nameParts = payload.fullName.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  const companyType =
    payload.role === 'developer'
      ? 'Developer'
      : payload.role === 'agent'
        ? 'Agent'
        : 'Broker'

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: payload.companyName.trim(),
      type: companyType,
      contact_name: payload.fullName,
      contact_email: payload.email,
      status: 'Active',
      created_by: userId,
    })
    .select('id')
    .single()

  if (companyError) {
    console.error('[SignUp] Error creating company:', companyError)
    throw new Error('Failed to create company. Please try again.')
  }

  // 3. Update user_profiles with company link
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email: payload.email,
      first_name: firstName,
      last_name: lastName,
      user_type: payload.role,
      company_id: company.id,
      company_name: payload.companyName.trim(),
      is_company_admin: true,
      membership_status: 'active',
      onboarding_step: 1,
      onboarding_completed: false,
    })

  if (profileError) {
    console.error('[SignUp] Error updating profile:', profileError)
    throw new Error('Failed to create profile. Please try again.')
  }

  return { userId, companyId: company.id }
}

export function useSignUp() {
  return useMutation({
    mutationFn: signUpUser,
    onSuccess: () => {
      toast.success('Account created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Sign up failed. Please try again.')
    },
  })
}
