'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Company } from '@/types'

function mapCompanyRow(c: any): Company {
  return {
    ...c,
    phone: c.contact_phone,
    tier: c.subscription_tier,
  }
}

// Explicit columns for companies table
const COMPANY_COLUMNS = [
  'id', 'name', 'type', 'status',
  'contact_name', 'contact_email', 'contact_phone', 'website',
  'subscription_status', 'subscription_tier', 'subscription_price',
  'billing_cycle', 'next_billing_date',
  'stripe_customer_id', 'stripe_subscription_id',
  'enabled_features',
  'created_at', 'updated_at',
].join(', ')

async function fetchCompanies(): Promise<Company[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = createClient()
  if (!supabase) return []

  let allCompanies: any[] = []
  let from = 0
  const batchSize = 50
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('companies')
      .select(COMPANY_COLUMNS)
      .order('name', { ascending: true })
      .range(from, from + batchSize - 1)

    if (error) {
      console.error('[useCompanies] Fetch error:', error.message)
      throw new Error(`Failed to fetch companies: ${error.message}`)
    }
    if (data && data.length > 0) {
      allCompanies = [...allCompanies, ...data]
      from += batchSize
      hasMore = data.length === batchSize
    } else {
      hasMore = false
    }
  }

  console.log('[useCompanies] Fetched companies:', allCompanies.length)
  return allCompanies.map(mapCompanyRow)
}

export function useCompanies() {
  const queryClient = useQueryClient()

  const {
    data: companies = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Company[], Error>({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  })

  const createCompanyMutation = useMutation({
    mutationFn: async (data: Partial<Company>) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { data: newData, error } = await supabase
        .from('companies')
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return newData
    },
    onSuccess: (newData) => {
      queryClient.setQueryData<Company[]>(['companies'], (old) =>
        [mapCompanyRow(newData), ...(old ?? [])]
      )
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
        .select()
        .single()

      if (error) throw error
      return { id, updatedData }
    },
    onSuccess: ({ id, updatedData }) => {
      const mapped = mapCompanyRow(updatedData)
      queryClient.setQueryData<Company[]>(['companies'], (old) =>
        old?.map((c) => (c.id === id ? mapped : c)) ?? []
      )
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
    onSuccess: (id) => {
      queryClient.setQueryData<Company[]>(['companies'], (old) =>
        old?.filter((c) => c.id !== id) ?? []
      )
      toast.success('Company deleted')
    },
    onError: (error: any) => {
      console.error('[useCompanies] Delete error:', error)
      toast.error('Failed to delete company', { description: error.message })
    },
  })

  // Convenience wrappers matching DataContext API
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
    isLoading,
    error: error?.message ?? null,
    refreshCompanies: refetch,
    createCompany,
    updateCompany,
    deleteCompany,
  }
}
