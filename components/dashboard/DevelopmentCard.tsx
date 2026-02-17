'use client'

import Link from 'next/link'
import { formatPriceRange, formatNumber } from '@/lib/utils'
import { Building2, Users, MapPin, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DevelopmentCardProps {
  id: string
  name: string
  location?: string
  priceFrom?: string | number
  priceTo?: string | number
  totalUnits?: number
  availabilityStatus?: string
  leadCount?: number
  avgScore?: number
  hotLeads?: number
  userType: string
}

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Coming Soon': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Sold Out': 'bg-red-500/10 text-red-400 border-red-500/30',
  'Paused': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
}

export function DevelopmentCard({
  id,
  name,
  location,
  priceFrom,
  priceTo,
  totalUnits,
  availabilityStatus = 'Active',
  leadCount = 0,
  avgScore = 0,
  hotLeads = 0,
  userType,
}: DevelopmentCardProps) {
  const priceRange = formatPriceRange(priceFrom, priceTo)
  const statusColor = STATUS_COLORS[availabilityStatus] || STATUS_COLORS['Active']

  return (
    <Link
      href={`/${userType}/developments/${id}`}
      className="block bg-[#111111] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-white/[0.02] transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{name}</h3>
            {location && (
              <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {location}
              </p>
            )}
          </div>
        </div>
        <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', statusColor)}>
          {availabilityStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {priceRange && (
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Price Range</p>
            <p className="text-white text-sm font-medium">{priceRange}</p>
          </div>
        )}
        {totalUnits != null && (
          <div>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Units</p>
            <p className="text-white text-sm font-medium">{totalUnits}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs text-white/50">{formatNumber(leadCount)} leads</span>
        </div>
        {hotLeads > 0 && (
          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
            {hotLeads} hot
          </span>
        )}
        {avgScore > 0 && (
          <span className="text-xs text-white/40">
            Avg score: {avgScore}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-white/40 transition-colors" />
      </div>
    </Link>
  )
}
