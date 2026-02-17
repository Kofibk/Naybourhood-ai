'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { PipelineBoard } from '@/components/dashboard/PipelineBoard'
import { LoadingState } from '@/components/ui/loading-state'
import { GitBranch } from 'lucide-react'

export default function DeveloperPipelinePage() {
  const { user } = useAuth()
  const [developments, setDevelopments] = useState<{ id: string; name: string }[]>([])
  const [selectedDev, setSelectedDev] = useState<string>('')

  useEffect(() => {
    const fetchDevelopments = async () => {
      if (!isSupabaseConfigured() || !user?.company_id) return

      const supabase = createClient()
      const { data } = await supabase
        .from('developments')
        .select('id, name')
        .eq('company_id', user.company_id)
        .order('name')

      if (data) setDevelopments(data)
    }

    fetchDevelopments()
  }, [user?.company_id])

  if (!user) return <LoadingState text="Loading..." className="h-64" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-primary" />
            Buyer Pipeline
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Drag and drop buyers between stages to update their status
          </p>
        </div>

        {developments.length > 0 && (
          <select
            value={selectedDev}
            onChange={(e) => setSelectedDev(e.target.value)}
            className="bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">All developments</option>
            {developments.map((dev) => (
              <option key={dev.id} value={dev.name}>{dev.name}</option>
            ))}
          </select>
        )}
      </div>

      <PipelineBoard
        userType="developer"
        developmentFilter={selectedDev || undefined}
      />
    </div>
  )
}
