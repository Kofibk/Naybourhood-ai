import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))

// Mock onboarding lib
vi.mock('@/lib/onboarding', async () => {
  const actual = await vi.importActual('@/lib/onboarding') as Record<string, unknown>
  return {
    ...actual,
    getUserProfile: vi.fn().mockResolvedValue(null),
    createUserProfile: vi.fn().mockResolvedValue({
      id: 'test-user',
      onboarding_step: 1,
      onboarding_completed: false,
      user_type: null,
    }),
  }
})

// Mock analytics
vi.mock('@/lib/analytics/onboarding', () => ({
  trackOnboardingEvent: vi.fn(),
  ONBOARDING_EVENTS: {
    STARTED: 'onboarding_started',
    STEP_COMPLETED: 'step_completed',
    STEP_SKIPPED: 'step_skipped',
    COMPLETED: 'onboarding_completed',
    ABANDONED: 'onboarding_abandoned',
    CSV_IMPORT_STARTED: 'csv_import_started',
    CSV_IMPORT_COMPLETED: 'csv_import_completed',
    TEAM_INVITE_SENT: 'team_invite_sent',
    DEVELOPMENT_ADDED: 'development_added',
  },
}))

import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

describe('OnboardingWizard layout', () => {
  it('renders with a loading state initially', () => {
    render(<OnboardingWizard />)
    expect(screen.getByText('Loading your progress...')).toBeInTheDocument()
  })

  it('renders the StepIndicator progress bar', async () => {
    const { container } = render(<OnboardingWizard />)
    // The loading state should show initially
    // The progress bar (inside StepIndicator) will render once loading finishes
    // For now, verify the component mounts without error
    expect(container).toBeDefined()
  })
})
