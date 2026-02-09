import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'

function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function generateApiKey(): string {
  const random = randomBytes(24).toString('base64url').slice(0, 32)
  return `nb_live_${random}`
}

// GET: List API keys for the current user's company
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 403 })
    }

    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, company_id, key_prefix, name, permissions, rate_limit_per_minute, is_active, last_used_at, created_at')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .range(0, 49)

    if (error) {
      console.error('[API Keys] Fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    return NextResponse.json({ keys: keys || [] })
  } catch (error) {
    console.error('[API Keys] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 403 })
    }

    const body = await request.json()
    const { name, permissions, rate_limit_per_minute } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 })
    }

    // Generate the full key and hash it
    const fullKey = generateApiKey()
    const keyHash = hashKey(fullKey)
    const keyPrefix = fullKey.slice(0, 8)

    const defaultPermissions = {
      score_single: true,
      score_batch: true,
      webhook: true,
    }

    const { data: newKey, error } = await supabase
      .from('api_keys')
      .insert({
        company_id: profile.company_id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name: name.trim(),
        permissions: permissions ? { ...defaultPermissions, ...permissions } : defaultPermissions,
        rate_limit_per_minute: rate_limit_per_minute || 60,
      })
      .select('id, company_id, key_prefix, name, permissions, rate_limit_per_minute, is_active, last_used_at, created_at')
      .single()

    if (error) {
      console.error('[API Keys] Create error:', error)
      return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
    }

    // Return the full key ONCE - it cannot be retrieved again
    return NextResponse.json({
      key: newKey,
      full_key: fullKey,
    })
  } catch (error) {
    console.error('[API Keys] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company associated' }, { status: 403 })
    }

    // Deactivate the key (soft delete for audit trail)
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('company_id', profile.company_id)

    if (error) {
      console.error('[API Keys] Revoke error:', error)
      return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Keys] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
