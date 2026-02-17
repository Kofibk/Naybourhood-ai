'use client'

import Link from 'next/link'
import {
  FileSpreadsheet,
  Home,
  UserPlus,
  Megaphone,
  Upload,
  Code,
  Plus,
} from 'lucide-react'

type UserType = 'developer' | 'agent' | 'broker'

interface EmptyStateProps {
  userType: UserType
}

export function NoLeadsEmptyState({ userType }: EmptyStateProps) {
  const basePath = `/${userType}`
  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 text-center">
      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">Import your first leads</h3>
      <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
        Get started by uploading your existing leads. We&apos;ll score and classify them automatically.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href={`${basePath}/buyers/import`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload CSV
        </Link>
        <Link
          href={`${basePath}/settings`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium rounded-lg border border-white/10 transition-colors"
        >
          <Code className="w-4 h-4" />
          API / Embed Code
        </Link>
      </div>
    </div>
  )
}

export function NoDevelopmentsEmptyState({ userType }: EmptyStateProps) {
  const basePath = `/${userType}`
  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 text-center">
      <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Home className="w-7 h-7 text-blue-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">Add your first development</h3>
      <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
        Add a development to start receiving scored leads matched to your projects.
      </p>
      <Link
        href={`${basePath}/developments`}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Development
      </Link>
    </div>
  )
}

export function NoTeamEmptyState({ userType }: EmptyStateProps) {
  const basePath = `/${userType}`
  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 text-center">
      <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <UserPlus className="w-7 h-7 text-purple-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">Invite your team</h3>
      <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
        Add team members so they can see their priority leads and take action.
      </p>
      <Link
        href={`${basePath}/settings`}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Invite Team Member
      </Link>
    </div>
  )
}

export function NoCampaignsEmptyState({ userType }: EmptyStateProps) {
  const basePath = `/${userType}`
  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl p-8 text-center">
      <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Megaphone className="w-7 h-7 text-amber-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">Activate Lead Gen</h3>
      <p className="text-white/50 text-sm mb-6 max-w-sm mx-auto">
        Get pre-scored buyers delivered to your dashboard with our lead generation campaigns.
      </p>
      <Link
        href={`${basePath}/campaigns`}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Megaphone className="w-4 h-4" />
        Learn More
      </Link>
    </div>
  )
}
