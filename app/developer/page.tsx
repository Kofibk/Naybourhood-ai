'use client'

import { UserDashboard } from '@/components/UserDashboard'
import { useAuth } from '@/contexts/AuthContext'

export default function DeveloperDashboard() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const userName = user?.name?.split(' ')[0] || 'Developer'

  return <UserDashboard userType="developer" userName={userName} companyId={user?.company_id} />
}
