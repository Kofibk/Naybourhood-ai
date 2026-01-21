'use client'

import Link from 'next/link'
import { useMountAnvilDemo } from '@/contexts/MountAnvilDemoContext'
import {
  DEMO_DEVELOPMENTS,
  DEMO_BUYERS,
  DEMO_CAMPAIGNS,
} from '@/lib/mount-anvil-demo-data'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Building2,
  MapPin,
  Home,
  Calendar,
  TrendingUp,
  Flame,
  ChevronRight,
  Plus,
  Edit,
  BarChart3,
  Wallet,
  Settings,
} from 'lucide-react'

export default function DevelopmentsPage() {
  const { user, isLoading } = useMountAnvilDemo()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Calculate stats for each development
  const developmentStats = DEMO_DEVELOPMENTS.map(dev => {
    const leads = DEMO_BUYERS.filter(b => b.development_id === dev.id)
    const hotLeads = leads.filter(b => b.ai_classification === 'Hot Lead').length
    const campaigns = DEMO_CAMPAIGNS.filter(c => c.development_id === dev.id)
    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
    const avgScore = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.ai_quality_score || 0), 0) / leads.length)
      : 0

    return {
      ...dev,
      leadCount: leads.length,
      hotLeads,
      campaignCount: campaigns.length,
      totalSpend,
      avgScore,
    }
  })

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight">Naybourhood</h1>
              <p className="text-white/40 text-xs">Mount Anvil</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/mount-anvil-demo"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/mount-anvil-demo/leads"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Users className="w-5 h-5" />
            Leads
          </Link>
          <Link
            href="/mount-anvil-demo/campaigns"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Megaphone className="w-5 h-5" />
            Campaigns
          </Link>
          <Link
            href="/mount-anvil-demo/developments"
            className="flex items-center gap-3 px-4 py-3 text-white bg-white/5 rounded-xl"
          >
            <Building2 className="w-5 h-5" />
            Developments
          </Link>
          <Link
            href="/mount-anvil-demo/settings"
            className="flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white font-medium">
              {user.firstName.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user.firstName}</p>
              <p className="text-white/40 text-xs">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold">Developments</h2>
              <p className="text-white/50 text-sm mt-1">
                Manage your property developments
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors">
              <Plus className="w-4 h-4" />
              Add Development
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Development Cards */}
          <div className="grid grid-cols-2 gap-6">
            {developmentStats.map((dev) => (
              <div
                key={dev.id}
                className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors"
              >
                {/* Header Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-white/20" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      dev.status === 'Selling'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {dev.status}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-white text-xl font-bold">{dev.name}</h3>
                    <div className="flex items-center gap-1 text-white/60 text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      {dev.location}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6">
                  {/* Price & Units */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-white/50 text-sm">Price Range</p>
                      <p className="text-white font-semibold">
                        {formatCurrency(parseInt(dev.price_from || '0'))} - {formatCurrency(parseInt(dev.price_to || '0'))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/50 text-sm">Available</p>
                      <p className="text-white font-semibold">
                        {dev.available_units} / {dev.total_units} units
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{dev.leadCount}</p>
                      <p className="text-white/40 text-xs">Leads</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <Flame className="w-5 h-5 text-red-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{dev.hotLeads}</p>
                      <p className="text-white/40 text-xs">Hot</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <BarChart3 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{dev.avgScore}</p>
                      <p className="text-white/40 text-xs">Avg Score</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <Megaphone className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-white font-bold">{dev.campaignCount}</p>
                      <p className="text-white/40 text-xs">Campaigns</p>
                    </div>
                  </div>

                  {/* Spend & Completion */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-white/60">
                      <Wallet className="w-4 h-4" />
                      <span className="text-sm">Total Spend: {formatCurrency(dev.totalSpend)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{dev.completion_date}</span>
                    </div>
                  </div>

                  {/* Features */}
                  {dev.features && dev.features.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex flex-wrap gap-2">
                        {dev.features.map((feature, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-white/5 text-white/60 text-xs rounded-lg"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-6">
                    <Link
                      href={`/mount-anvil-demo/leads?development=${dev.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      View Leads
                    </Link>
                    <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State for Adding More */}
          <div className="mt-6">
            <button className="w-full py-12 border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl text-white/40 hover:text-white/60 transition-colors flex items-center justify-center gap-3">
              <Plus className="w-6 h-6" />
              <span className="font-medium">Add New Development</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
