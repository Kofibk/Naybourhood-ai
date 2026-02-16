'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Development } from '@/types'

function mapDevelopmentRow(d: any): Development {
  return {
    ...d,
    id: d.id,
    name: d.name || d.development_name || d['Development Name'] || 'Unnamed',
    location: d.location || d.city || d['Location'] || d['area'],
    address: d.address || d.full_address || d['Address'],
    developer: d.developer || d.company_name || d['Developer'] || d['developer_name'],
    status: d.status || d.completion_status || d['Status'] || 'Active',
    units: d.units ?? d['Units'] ?? d.total_units ?? null,
    total_units: d.total_units ?? d['Total Units'] ?? d.units ?? null,
    available_units: d.available_units ?? d['Available Units'] ?? null,
    price_from: d.price_from || d['Price From'] || d['min_price'],
    price_to: d.price_to || d['Price To'] || d['max_price'],
    completion_date: d.completion_date || d['Completion Date'],
    description: d.description || d['Description'],
    image_url: d.image_url || d['Image URL'] || d['image'],
    total_leads: d.total_leads ?? d['Total Leads'] ?? 0,
    ad_spend: d.ad_spend ?? d['Ad Spend'] ?? d['total_spend'] ?? d['Total Spend'] ?? 0,
    brochure_url: d.brochure_url || d['Brochure URL'] || d['brochure'],
    floor_plan_url: d.floor_plan_url || d['Floor Plan URL'] || d['floor_plan'],
    price_list_url: d.price_list_url || d['Price List URL'] || d['price_list'],
    attachments: d.attachments || d['Attachments'] || [],
    created_at: d.created_at,
    updated_at: d.updated_at,
  }
}

async function fetchDevelopments(): Promise<Development[]> {
  if (!isSupabaseConfigured()) return []
  const supabase = createClient()
  if (!supabase) return []

  const { data, error } = await supabase.from('developments').select('*, company:companies(*)')
  if (error) {
    console.error('[useDevelopments] Fetch error:', error.message)
    throw new Error(`Failed to fetch developments: ${error.message}`)
  }
  return (data || []).map(mapDevelopmentRow)
}

export function useDevelopments() {
  const queryClient = useQueryClient()

  const { data: developments = [], isLoading, error, refetch } = useQuery<Development[], Error>({
    queryKey: ['developments'],
    queryFn: fetchDevelopments,
  })

  const createDevelopmentMutation = useMutation({
    mutationFn: async (data: Partial<Development>) => {
      if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
      const supabase = createClient()
      if (!supabase) throw new Error('Failed to create Supabase client')

      const { data: newData, error } = await supabase
        .from('developments').insert(data).select('*, company:companies(*)').single()
      if (error) throw error
      return newData
    },
    onSuccess: (newData) => {
      queryClient.setQueryData<Development[]>(['developments'], (old) => [mapDevelopmentRow(newData), ...(old ?? [])])
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
        .from('developments').update(cleanData).eq('id', id).select('*, company:companies(*)').single()
      if (error) throw error
      return { id, updatedData }
    },
    onSuccess: ({ id, updatedData }) => {
      const mapped = mapDevelopmentRow(updatedData)
      queryClient.setQueryData<Development[]>(['developments'], (old) =>
        old?.map((d) => (d.id === id ? mapped : d)) ?? []
      )
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
    onSuccess: (id) => {
      queryClient.setQueryData<Development[]>(['developments'], (old) => old?.filter((d) => d.id !== id) ?? [])
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

  return { developments, isLoading, error: error?.message ?? null, refreshDevelopments: refetch, createDevelopment, updateDevelopment, deleteDevelopment }
}
