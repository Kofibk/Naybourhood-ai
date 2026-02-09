'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSignUp } from '@/hooks/useSignUp'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface SignUpFormProps {
  onSuccess?: () => void
}

type UserRole = 'developer' | 'agent' | 'broker'
type CompanySize = '1-5' | '6-20' | '21-50' | '50+'

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [companySize, setCompanySize] = useState<CompanySize | ''>('')
  const router = useRouter()
  const signUpMutation = useSignUp()

  const isFormValid =
    email.trim() !== '' &&
    password.length >= 6 &&
    fullName.trim() !== '' &&
    companyName.trim() !== '' &&
    role !== '' &&
    companySize !== ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid || !role || !companySize) return

    try {
      await signUpMutation.mutateAsync({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        companyName: companyName.trim(),
        role,
        companySize,
      })

      toast.success('Account created! Redirecting...')
      onSuccess?.()
      router.push('/onboarding/setup')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sign up failed'
      toast.error(message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          placeholder="Jane Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Company name</Label>
        <Input
          id="companyName"
          placeholder="Acme Properties"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Your role</Label>
        <Select
          value={role}
          onValueChange={(v) => setRole(v as UserRole)}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="developer">Developer</SelectItem>
            <SelectItem value="agent">Estate Agent</SelectItem>
            <SelectItem value="broker">Mortgage Broker</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="companySize">Company size</Label>
        <Select
          value={companySize}
          onValueChange={(v) => setCompanySize(v as CompanySize)}
        >
          <SelectTrigger id="companySize">
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-5">1-5 people</SelectItem>
            <SelectItem value="6-20">6-20 people</SelectItem>
            <SelectItem value="21-50">21-50 people</SelectItem>
            <SelectItem value="50+">50+ people</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!isFormValid || signUpMutation.isPending}
      >
        {signUpMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  )
}
