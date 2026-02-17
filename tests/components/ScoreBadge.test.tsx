import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScoreBadge } from '@/components/dashboard/ScoreBadge'

describe('ScoreBadge', () => {
  it('renders the score value', () => {
    render(<ScoreBadge score={85} />)
    expect(screen.getByText('85')).toBeInTheDocument()
  })

  it('renders green (emerald) for scores >= 70', () => {
    const { container } = render(<ScoreBadge score={75} />)
    const badge = container.querySelector('.rounded-full')
    expect(badge?.className).toContain('bg-emerald-500/10')
    expect(badge?.className).toContain('text-emerald-400')
    expect(badge?.className).toContain('border-emerald-500/30')
  })

  it('renders amber for scores >= 40 and < 70', () => {
    const { container } = render(<ScoreBadge score={55} />)
    const badge = container.querySelector('.rounded-full')
    expect(badge?.className).toContain('bg-amber-500/10')
    expect(badge?.className).toContain('text-amber-400')
    expect(badge?.className).toContain('border-amber-500/30')
  })

  it('renders gray (zinc) for scores < 40', () => {
    const { container } = render(<ScoreBadge score={20} />)
    const badge = container.querySelector('.rounded-full')
    expect(badge?.className).toContain('bg-zinc-500/10')
    expect(badge?.className).toContain('text-zinc-400')
    expect(badge?.className).toContain('border-zinc-500/30')
  })

  it('shows NB Score label when showLabel is true', () => {
    render(<ScoreBadge score={85} showLabel />)
    expect(screen.getByText('NB Score')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { container: sm } = render(<ScoreBadge score={50} size="sm" />)
    expect(sm.querySelector('.rounded-full')?.className).toContain('w-8')

    const { container: lg } = render(<ScoreBadge score={50} size="lg" />)
    expect(lg.querySelector('.rounded-full')?.className).toContain('w-14')
  })
})
