'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApiKeys } from '@/hooks/useApiKeys'
import { toast } from 'sonner'
import {
  Key,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return formatDate(dateStr)
}

interface NewKeyDisplayProps {
  fullKey: string
  onClose: () => void
}

function NewKeyDisplay({ fullKey, onClose }: NewKeyDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullKey)
      setCopied(true)
      toast.success('API key copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy key')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Created
          </DialogTitle>
          <DialogDescription>
            Copy your API key now. You will not be able to see it again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <code className="flex-1 text-sm font-mono break-all">{fullKey}</code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200">
              This key will only be shown once. Store it securely. If lost, you&apos;ll
              need to create a new key.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ApiKeysManager() {
  const { keys, isLoading, createKey, isCreating, revokeKey, isRevoking } = useApiKeys()
  const [newKeyName, setNewKeyName] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newFullKey, setNewFullKey] = useState<string | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null)

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    try {
      const result = await createKey({ name: newKeyName.trim() })
      setNewFullKey(result.full_key)
      setNewKeyName('')
      setShowCreateDialog(false)
      toast.success('API key created')
    } catch {
      // Error handled in hook
    }
  }

  const handleRevoke = async () => {
    if (!revokeTarget) return
    try {
      await revokeKey(revokeTarget.id)
      setRevokeTarget(null)
    } catch {
      // Error handled in hook
    }
  }

  const activeKeys = keys.filter(k => k.is_active)
  const revokedKeys = keys.filter(k => !k.is_active)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to the Scoring API
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : activeKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No API keys yet</p>
              <p className="text-sm">Create a key to start using the Scoring API</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeKeys.map(key => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Key className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{key.name}</div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <code className="text-xs">{key.key_prefix}...****</code>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {key.last_used_at
                            ? `Used ${formatTimeAgo(key.last_used_at)}`
                            : 'Never used'}
                        </span>
                        <span className="hidden sm:inline">
                          Created {formatDate(key.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge variant="success" className="hidden sm:flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Active
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokeTarget({ id: key.id, name: key.name })}
                      className="text-destructive hover:text-destructive"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Revoked keys section */}
          {revokedKeys.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Revoked Keys
              </h4>
              <div className="space-y-2">
                {revokedKeys.map(key => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm">{key.name}</span>
                        <code className="text-xs text-muted-foreground ml-2">
                          {key.key_prefix}...
                        </code>
                      </div>
                    </div>
                    <Badge variant="secondary">Revoked</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give your key a descriptive name to identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Key Name</label>
              <Input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="e.g. Production CRM Integration"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating || !newKeyName.trim()}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Key Display */}
      {newFullKey && (
        <NewKeyDisplay
          fullKey={newFullKey}
          onClose={() => setNewFullKey(null)}
        />
      )}

      {/* Revoke Confirm Dialog */}
      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => { if (!open) setRevokeTarget(null) }}
        title="Revoke API Key"
        description={`Are you sure you want to revoke "${revokeTarget?.name}"? Any integrations using this key will stop working immediately.`}
        confirmLabel="Revoke Key"
        variant="destructive"
        onConfirm={handleRevoke}
        loading={isRevoking}
      />
    </div>
  )
}
