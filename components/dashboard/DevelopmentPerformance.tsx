'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { DevelopmentCard } from './DevelopmentCard'
import { Loader2, Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface BuyerRow {
  development_name?: string
  ai_classification?: string
  final_score?: number
  ai_quality_score?: number
}

interface DevelopmentRow {
  id: string
  name: string
  location?: string
  price_from?: string
  price_to?: string
  total_units?: number
  availability_status?: string
  status?: string
}

interface DevelopmentWithStats extends DevelopmentRow {
  leadCount: number
  hotLeads: number
  avgScore: number
}

export function DevelopmentPerformance() {
  const { user } = useAuth()
  const [developments, setDevelopments] = useState<DevelopmentWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchDevelopments = useCallback(async () => {
    if (!isSupabaseConfigured() || !user?.company_id) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Fetch developments
      const { data: devs, error } = await supabase
        .from('developments')
        .select('id, name, location, price_from, price_to, total_units, availability_status, status')
        .eq('company_id', user.company_id)
        .order('name')

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Developments] Error:', error)
        }
        setIsLoading(false)
        return
      }

      if (!devs || devs.length === 0) {
        setDevelopments([])
        setIsLoading(false)
        return
      }

      // Fetch buyer stats per development
      const { data: buyers } = await supabase
        .from('buyers')
        .select('development_name, ai_classification, final_score, ai_quality_score')
        .eq('company_id', user.company_id)

      const typedBuyers: BuyerRow[] = (buyers || []) as BuyerRow[]
      const typedDevs: DevelopmentRow[] = devs as DevelopmentRow[]

      const devWithStats: DevelopmentWithStats[] = typedDevs.map((dev) => {
        const devBuyers = typedBuyers.filter(
          (b) => b.development_name === dev.name
        )

        const hotLeads = devBuyers.filter(
          (b) => b.ai_classification === 'Hot Lead' || b.ai_classification === 'Hot'
        ).length

        const scores = devBuyers
          .map((b) => b.final_score || b.ai_quality_score || 0)
          .filter((s) => s > 0)

        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0

        return {
          ...dev,
          leadCount: devBuyers.length,
          hotLeads,
          avgScore,
        }
      })

      setDevelopments(devWithStats)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Developments] Error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user?.company_id])

  useEffect(() => {
    fetchDevelopments()
  }, [fetchDevelopments])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (developments.length === 0) {
    return (
      <div className="text-center py-12 bg-[#111111] border border-white/10 rounded-2xl">
        <Building2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
        <h3 className="text-white font-medium mb-2">No developments yet</h3>
        <p className="text-white/40 text-sm mb-4">
          Add your first development to start tracking performance
        </p>
        <Link href="/developer/developments">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Development
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {developments.map((dev) => (
        <DevelopmentCard
          key={dev.id}
          id={dev.id}
          name={dev.name}
          location={dev.location}
          priceFrom={dev.price_from}
          priceTo={dev.price_to}
          totalUnits={dev.total_units}
          availabilityStatus={dev.availability_status || dev.status || 'Active'}
          leadCount={dev.leadCount}
          hotLeads={dev.hotLeads}
          avgScore={dev.avgScore}
          userType="developer"
        />
      ))}
    </div>
  )
}
