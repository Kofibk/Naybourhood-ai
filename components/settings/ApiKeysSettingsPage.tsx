'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'
import { Settings, Key } from 'lucide-react'

export function ApiKeysSettingsPage() {
  const pathname = usePathname()
  const router = useRouter()

  // Determine the base settings path from the current URL
  const isAdmin = pathname.startsWith('/admin')
  const basePath = isAdmin ? '/admin/settings' : '/developer/settings'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account, preferences, and API access
        </p>
      </div>

      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger
            value="general"
            onClick={() => router.push(basePath)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <ApiKeysManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
