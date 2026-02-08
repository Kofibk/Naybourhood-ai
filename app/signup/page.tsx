'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { SignUpForm } from '@/components/signup/SignUpForm'
import { QueryProvider } from '@/contexts/QueryProvider'
import { Toaster } from 'sonner'

export default function SignUpPage() {
  return (
    <QueryProvider>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo variant="light" size="lg" />
            </div>
            <p className="text-white/60 text-sm mt-2">
              Create your account to get started
            </p>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-xl p-6 shadow-xl">
            <SignUpForm />
          </div>

          <p className="text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#34D399] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </QueryProvider>
  )
}
