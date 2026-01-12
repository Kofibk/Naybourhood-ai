'use client'

import { useEffect, useState } from 'react'
import { UserDashboard } from '@/components/UserDashboard'

interface StoredUser {
  name?: string
  company_id?: string
}

export default function DeveloperDashboard() {
  const [user, setUser] = useState<StoredUser | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      setUser(JSON.parse(stored))
    } else {
      setUser({}) // Set empty object to trigger demo mode
    }
  }, [])

  // Show nothing briefly while checking localStorage
  if (user === null) {
    return null
  }

  const userName = user?.name?.split(' ')[0] || 'Developer'

  return <UserDashboard userType="developer" userName={userName} companyId={user?.company_id} />
}
