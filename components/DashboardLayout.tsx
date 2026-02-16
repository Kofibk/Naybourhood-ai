'use client'

import { ReactNode } from 'react'
import { Sidebar, UserType } from './Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  userType: UserType
  userName?: string
  userEmail?: string
  onLogout?: () => void
  headerAction?: ReactNode
}

export function DashboardLayout({
  children,
  title,
  userType,
  userName,
  userEmail,
  onLogout,
  headerAction,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">
      <Sidebar userType={userType} userName={userName} userEmail={userEmail} onLogout={onLogout} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-[#171717] border-b border-white/10 px-4 py-4 lg:px-6 flex items-center gap-4 flex-shrink-0">
          <div className="lg:hidden w-10" />
          <h1 className="text-lg font-medium text-white flex-1 truncate tracking-tight">{title}</h1>
          {headerAction}
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-6 bg-[#0A0A0A]">{children}</div>
      </main>
    </div>
  )
}
