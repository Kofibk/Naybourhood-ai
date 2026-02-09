'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from '@/types/api-keys'

async function fetchApiKeys(): Promise<ApiKey[]> {
  const res = await fetch('/api/api-keys')
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to fetch API keys')
  }
  const data = await res.json()
  return data.keys
}

async function createApiKey(body: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
  const res = await fetch('/api/api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to create API key')
  }
  return res.json()
}

async function revokeApiKey(keyId: string): Promise<void> {
  const res = await fetch(`/api/api-keys?id=${keyId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Failed to revoke API key')
  }
}

export function useApiKeys() {
  const queryClient = useQueryClient()

  const {
    data: keys = [],
    isLoading,
    error,
  } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: fetchApiKeys,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
    onError: (error: Error) => {
      toast.error('Failed to create API key', {
        description: error.message,
      })
    },
  })

  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
      toast.success('API key revoked')
    },
    onError: (error: Error) => {
      toast.error('Failed to revoke API key', {
        description: error.message,
      })
    },
  })

  return {
    keys,
    isLoading,
    error,
    createKey: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    revokeKey: revokeMutation.mutateAsync,
    isRevoking: revokeMutation.isPending,
  }
}
