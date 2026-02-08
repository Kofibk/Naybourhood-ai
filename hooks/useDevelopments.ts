'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Development } from '@/types'

// Explicit columns for developments table with company join - no select('*')
const DEVELOPMENTS_COLUMNS = [
  'id', 'name', 'location', 'address', 'developer', 'company_id', 'status',
  'units', 'total_units', 'available_units', 'price_from', 'price_to',
  'completion_date', 'description', 'image_url',
  'total_leads', 'ad_spend',
  'brochure_url', 'floor_plan_url', 'price_list_url', 'attachments',
  'created_at', 'updated_at',
].join(', ')

const DEVELOPMENTS_WITH_COMPANY = `${DEVELOPMENTS_COLUMNS}, company:companies(id, name, type)`

export interface UseDevelopmentsOptions {
  page?: number
  limit?: number
  companyId?: string
}

function mapDevelopmentRow(d: Record<string, any>): Development {
  return {
    ...d,
    id: d.id,
    name: d.name || 'Unnamed',
    location: d.location,
    address: d.address,
    developer: d.developer,
    status: d.status || 'Active',
    units: d.units ?? d.total_units ?? null,
    total_units: d.total_units ?? d.units ?? null,
    available_units: d.available_units ?? null,
    price_from: d.price_from,
    price_to: d.price_to,
    completion_date: d.completion_date,
    description: d.description,
    image_url: d.image_url,
    total_leads: d.total_leads ?? 0,
    ad_spend: d.ad_spend ?? 0,
    brochure_url: d.brochure_url,
    floor_plan_url: d.floor_plan_url,
    price_list_url: d.price_list_url,
    attachments: d.attachments || [],
    created_at: d.created_at,
    updated_at: d.updated_at,
  }
}

async function fetchDevelopments(
  options: UseDevelopmentsOptions
): Promise<{ data: Development[]; totalCount: number }> {
  if (!isSupabaseConfigured()) return { data: [], totalCount: 0 }
  const supabase = createClient()
  if (!supabase) return { data: [], totalCount: 0 }

  const { page = 0, limit = 50, companyId } = options
  const from = page * limit
  const to = from + limit - 1

  let query = supabase
    .from('developments')
    .select(DEVELOPMENTS_WITH_COMPANY, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (companyId) {
    query = query.eq('company_id', companyId)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('[useDevelopments] Fetch error:', error.message)
    throw new Error(`Failed to fetch developments: ${error.message}`)
  }

  return {
    data: (data || []).map(mapDevelopmentRow),
    totalCount: count ?? 0,
  }
}

export function useDevelopments(options: UseDevelopmentsOptions = {}) {
  const queryClient = useQueryClient()

  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['developments', options],
    queryFn: () => fetchDevelopments(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const developments = result?.data ?? []
  const totalCount = result?.totalCount ?? 0

  const createDevelopmentMutation = useMutation({
    mutationFn: async (data: Partial<Development>) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { data: newData, error } = await supabase
        .from('developments').insert(data).select(DEVELOPMENTS_WITH_COMPANY).single()
      if (error) throw error
      return newData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developments'] })
      toast.success('Development created')
    },
    onError: (error: any) => {
      console.error('[useDevelopments] Create error:', error)
      toast.error('Failed to create development', { description: error.message })
    },
  })

  const updateDevelopmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Development> }) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const excludeColumns = ['id', 'created_at']
      const cleanData: Record<string, any> = {}
      for (const [key, value] of Object.entries(data)) {
        if (!excludeColumns.includes(key) && value !== undefined) cleanData[key] = value
      }
      cleanData.updated_at = new Date().toISOString()

      const { data: updatedData, error } = await supabase
        .from('developments').update(cleanData).eq('id', id).select(DEVELOPMENTS_WITH_COMPANY).single()
      if (error) throw error
      return { id, updatedData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developments'] })
      toast.success('Development updated')
    },
    onError: (error: any) => {
      console.error('[useDevelopments] Update error:', error)
      toast.error('Failed to update development', { description: error.message })
    },
  })

  const deleteDevelopmentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { error } = await supabase.from('developments').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developments'] })
      toast.success('Development deleted')
    },
    onError: (error: any) => {
      console.error('[useDevelopments] Delete error:', error)
      toast.error('Failed to delete development', { description: error.message })
    },
  })

  const createDevelopment = async (data: Partial<Development>): Promise<Development | null> => {
    try { return await createDevelopmentMutation.mutateAsync(data) } catch { return null }
  }
  const updateDevelopment = async (id: string, data: Partial<Development>): Promise<Development | null> => {
    try { const r = await updateDevelopmentMutation.mutateAsync({ id, data }); return r.updatedData } catch { return null }
  }
  const deleteDevelopment = async (id: string): Promise<boolean> => {
    try { await deleteDevelopmentMutation.mutateAsync(id); return true } catch { return false }
  }

  return {
    developments,
    totalCount,
    isLoading,
    error: error?.message ?? null,
    refreshDevelopments: refetch,
    createDevelopment,
    updateDevelopment,
    deleteDevelopment,
  }
}
