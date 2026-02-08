import { NextResponse } from 'next/server'

export async function GET() {
  const enabled = !!process.env.STRIPE_SECRET_KEY
  return NextResponse.json({ enabled })
}
