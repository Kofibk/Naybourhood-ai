'use client'

import { useEffect, useState } from 'react'
import { UserDashboard } from '@/components/UserDashboard'

export default function DeveloperDashboard() {
  const [userName, setUserName] = useState('Developer')

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const user = JSON.parse(stored)
      setUserName(user.name?.split(' ')[0] || 'Developer')
    }
  }, [])

  return <UserDashboard userType="developer" userName={userName} />
}
