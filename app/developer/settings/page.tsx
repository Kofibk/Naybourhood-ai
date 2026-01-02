'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SUBSCRIPTION_TIERS } from '@/lib/subscriptionTiers'
import { Bell, User, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState({ name: '', email: '' })

  useEffect(() => {
    const stored = localStorage.getItem('naybourhood_user')
    if (stored) {
      const parsed = JSON.parse(stored)
      setUser({ name: parsed.name || '', email: parsed.email || '' })
    }
  }, [])

  const currentTier = SUBSCRIPTION_TIERS.growth

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold font-display">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={user.name} readOnly />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={user.email} readOnly />
            </div>
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{currentTier.name}</span>
                {currentTier.popular && <Badge>Popular</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {currentTier.contactsDisplay}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{currentTier.priceDisplay}</div>
              <div className="text-sm text-muted-foreground">/month</div>
            </div>
          </div>
          <Button variant="outline" className="mt-4">
            Manage Subscription
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">New Buyer Alerts</div>
              <div className="text-sm text-muted-foreground">
                Get notified when new buyers match your criteria
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Message Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive alerts for new messages
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enabled
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
