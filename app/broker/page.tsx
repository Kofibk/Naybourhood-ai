'use client'

import { useEffect, useState } from 'react'
import { UserDashboard } from '@/components/UserDashboard'

export default function BrokerDashboard() {
  const [userName, setUserName] = useState('Broker')

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const user = JSON.parse(stored)
      setUserName(user.name?.split(' ')[0] || 'Broker')
    }
  }, [])

  return <UserDashboard userType="broker" userName={userName} />
}
