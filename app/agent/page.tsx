'use client'

import { useEffect, useState } from 'react'
import { UserDashboard } from '@/components/UserDashboard'

export default function AgentDashboard() {
  const [userName, setUserName] = useState('Agent')

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const user = JSON.parse(stored)
      setUserName(user.name?.split(' ')[0] || 'Agent')
    }
  }, [])

  return <UserDashboard userType="agent" userName={userName} />
}
