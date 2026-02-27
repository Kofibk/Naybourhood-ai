'use client'

import { useState } from 'react'
import { DEMO_PROPERTY, DEMO_AVAILABLE_UNITS, ALL_ENQUIRERS, getEnquirersForUnit } from '@/lib/gcpdemo'
import type { DemoEnquirer, DemoUnit } from '@/lib/gcpdemo/types'
import { EnquirerDetailPanel } from '@/components/gcpdemo/EnquirerDetailPanel'
import { MapPin, DoorOpen } from 'lucide-react'
import { NBScoreRing } from '@/components/ui/nb-score-ring'

function UnitCard({ unit, onSelectLead }: { unit: DemoUnit; onSelectLead: (e: DemoEnquirer) => void }) {
  const leads = getEnquirersForUnit(unit.name)
  const typeColor = unit.type === 'Studio' ? 'bg-blue-500/20 text-blue-400' :
    unit.type === '1 Bed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'

  return (
    <div className="bg-[#111111] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <DoorOpen className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Unit {unit.name}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor}`}>{unit.type}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">£{unit.rentPCM.toLocaleString()}</p>
          <p className="text-[10px] text-white/40">PCM</p>
        </div>
      </div>

      <div className="text-xs text-white/50 mb-3">
        Available from {new Date(unit.availableFrom).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>

      {leads.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Matched Leads ({leads.length})</p>
          <div className="space-y-2">
            {leads.map(lead => (
              <button
                key={lead.id}
                onClick={() => onSelectLead(lead)}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors text-left"
              >
                <NBScoreRing score={lead.aiScore} size={32} strokeWidth={3} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{lead.fullName}</p>
                  <p className="text-[10px] text-white/40">{lead.employer} · {lead.pipelineStatus}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  lead.riskLevel === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                  lead.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                }`}>{lead.riskLevel}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-white/30 italic">No matched leads yet</p>
      )}
    </div>
  )
}

export default function BuildingPage() {
  const [selectedEnquirer, setSelectedEnquirer] = useState<DemoEnquirer | null>(null)
  const buildingEnquirers = ALL_ENQUIRERS.filter(
    e => e.pipelineStatus !== 'Archived' && e.pipelineStatus !== 'Fell Through'
  )

  return (
    <div className="space-y-6">
      {/* Property Header */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{DEMO_PROPERTY.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-white/50">
              <MapPin className="w-4 h-4" />
              <span>{DEMO_PROPERTY.address}, {DEMO_PROPERTY.postcode}</span>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{DEMO_PROPERTY.totalUnits}</p>
              <p className="text-xs text-white/40">Total Units</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{DEMO_PROPERTY.occupiedUnits}</p>
              <p className="text-xs text-white/40">Occupied</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{DEMO_PROPERTY.availableUnits}</p>
              <p className="text-xs text-white/40">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{DEMO_PROPERTY.occupancyRate}%</p>
              <p className="text-xs text-white/40">Occupancy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Units */}
      <div>
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#34D399]" />
          <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
            AVAILABLE UNITS ({DEMO_AVAILABLE_UNITS.length})
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DEMO_AVAILABLE_UNITS.map(unit => (
            <UnitCard key={unit.id} unit={unit} onSelectLead={setSelectedEnquirer} />
          ))}
        </div>
      </div>

      {/* Building Enquirers Summary */}
      <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-white/70">
              ALL ENQUIRERS ({buildingEnquirers.length} active)
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/[0.03] rounded-lg">
            <p className="text-xl font-bold text-emerald-400">{buildingEnquirers.filter(e => e.riskLevel === 'Low').length}</p>
            <p className="text-xs text-white/40">Low Risk</p>
          </div>
          <div className="text-center p-3 bg-white/[0.03] rounded-lg">
            <p className="text-xl font-bold text-amber-400">{buildingEnquirers.filter(e => e.riskLevel === 'Medium').length}</p>
            <p className="text-xs text-white/40">Medium Risk</p>
          </div>
          <div className="text-center p-3 bg-white/[0.03] rounded-lg">
            <p className="text-xl font-bold text-red-400">{buildingEnquirers.filter(e => e.riskLevel === 'High').length}</p>
            <p className="text-xs text-white/40">High Risk</p>
          </div>
          <div className="text-center p-3 bg-white/[0.03] rounded-lg">
            <p className="text-xl font-bold text-white">{Math.round(buildingEnquirers.reduce((a, e) => a + e.aiScore, 0) / buildingEnquirers.length)}</p>
            <p className="text-xs text-white/40">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEnquirer && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedEnquirer(null)} />
          <EnquirerDetailPanel
            enquirer={selectedEnquirer}
            onClose={() => setSelectedEnquirer(null)}
          />
        </>
      )}
    </div>
  )
}
