'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Company } from '@/types'

// Explicit columns for companies table - no select('*')
const COMPANIES_COLUMNS = [
  'id', 'name', 'type', 'website',
  'contact_name', 'contact_email', 'contact_phone',
  'status', 'ad_spend', 'total_leads', 'campaign_count',
  'subscription_status', 'subscription_tier', 'subscription_price',
  'billing_cycle', 'next_billing_date',
  'stripe_customer_id', 'stripe_subscription_id',
  'created_at', 'updated_at',
].join(', ')

export interface UseCompaniesOptions {
  page?: number
  limit?: number
  search?: string
}

function mapCompanyRow(c: Record<string, any>): Company {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    website: c.website,
    contact_name: c.contact_name,
    contact_email: c.contact_email,
    contact_phone: c.contact_phone,
    phone: c.contact_phone,
    status: c.status,
    ad_spend: c.ad_spend,
    total_leads: c.total_leads,
    campaign_count: c.campaign_count,
    subscription_status: c.subscription_status,
    subscription_tier: c.subscription_tier,
    tier: c.subscription_tier,
    subscription_price: c.subscription_price,
    billing_cycle: c.billing_cycle,
    next_billing_date: c.next_billing_date,
    stripe_customer_id: c.stripe_customer_id,
    stripe_subscription_id: c.stripe_subscription_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }
}

async function fetchCompanies(
  options: UseCompaniesOptions
): Promise<{ data: Company[]; totalCount: number }> {
  if (!isSupabaseConfigured()) return { data: [], totalCount: 0 }

  const supabase = createClient()
  if (!supabase) return { data: [], totalCount: 0 }

  const { page = 0, limit = 50, search } = options
  const from = page * limit
  const to = from + limit - 1

  let query = supabase
    .from('companies')
    .select(COMPANIES_COLUMNS, { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, to)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[useCompanies] Fetch error:', error.message)
    throw new Error(`Failed to fetch companies: ${error.message}`)
  }

  return {
    data: (data || []).map(mapCompanyRow),
    totalCount: count ?? 0,
  }
}

export function useCompanies(options: UseCompaniesOptions = {}) {
  const queryClient = useQueryClient()

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['companies', options],
    queryFn: () => fetchCompanies(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const companies = result?.data ?? []
  const totalCount = result?.totalCount ?? 0

  const createCompanyMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { data: newData, error } = await supabase
        .from('companies')
        .insert(data)
        .select(COMPANIES_COLUMNS)
        .single()

      if (error) throw error
      return newData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company created')
    },
    onError: (error: any) => {
      console.error('[useCompanies] Create error:', error)
      toast.error('Failed to create company', { description: error.message })
    },
  })

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const excludeColumns = ['id', 'created_at', 'phone', 'tier']

      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) {
          cleanData[key] = value
        }
      }
      cleanData.updated_at = new Date().toISOString()

      const { data: updatedData, error } = await supabase
        .from('companies')
        .update(cleanData)
        .eq('id', id)
        .select(COMPANIES_COLUMNS)
        .single()

      if (error) throw error
      return { id, updatedData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company updated')
    },
    onError: (error: any) => {
      console.error('[useCompanies] Update error:', error)
      toast.error('Failed to update company', { description: error.message })
    },
  })

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Company deleted')
    },
    onError: (error: any) => {
      console.error('[useCompanies] Delete error:', error)
      toast.error('Failed to delete company', { description: error.message })
    },
  })

  const createCompany = async (data: Partial<Company>): Promise<Company | null> => {
    try {
      return await createCompanyMutation.mutateAsync(data)
    } catch {
      return null
    }
  }

  const updateCompany = async (id: string, data: Partial<Company>): Promise<Company | null> => {
    try {
      const result = await updateCompanyMutation.mutateAsync({ id, data })
      return result.updatedData
    } catch {
      return null
    }
  }

  const deleteCompany = async (id: string): Promise<boolean> => {
    try {
      await deleteCompanyMutation.mutateAsync(id)
      return true
    } catch {
      return false
    }
  }

  return {
    companies,
    totalCount,
    isLoading,
    error: error?.message ?? null,
    refreshCompanies: refetch,
    createCompany,
    updateCompany,
    deleteCompany,
  }
}
