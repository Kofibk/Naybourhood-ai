import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ClassificationPill } from '@/components/dashboard/ClassificationPill'

describe('ClassificationPill', () => {
  it('renders the classification text', () => {
    render(<ClassificationPill classification="Hot Lead" />)
    expect(screen.getByText('Hot Lead')).toBeInTheDocument()
  })

  it('renders red styling for Hot Lead', () => {
    const { container } = render(<ClassificationPill classification="Hot Lead" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-red-400')
    expect(pill?.className).toContain('bg-red-500/15')
  })

  it('renders red styling for Hot', () => {
    const { container } = render(<ClassificationPill classification="Hot" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-red-400')
  })

  it('renders green styling for Qualified', () => {
    const { container } = render(<ClassificationPill classification="Qualified" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-emerald-400')
    expect(pill?.className).toContain('bg-emerald-500/15')
  })

  it('renders amber styling for Needs Qualification', () => {
    const { container } = render(<ClassificationPill classification="Needs Qualification" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-amber-400')
    expect(pill?.className).toContain('bg-amber-500/15')
  })

  it('renders blue styling for Nurture', () => {
    const { container } = render(<ClassificationPill classification="Nurture" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-blue-400')
    expect(pill?.className).toContain('bg-blue-500/15')
  })

  it('renders gray styling for Low Priority', () => {
    const { container } = render(<ClassificationPill classification="Low Priority" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-zinc-400')
    expect(pill?.className).toContain('bg-zinc-500/15')
  })

  it('falls back to Low Priority styling for unknown classification', () => {
    const { container } = render(<ClassificationPill classification="Unknown Type" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-zinc-400')
  })

  it('renders small size correctly', () => {
    const { container } = render(<ClassificationPill classification="Hot Lead" size="sm" />)
    const pill = container.querySelector('.inline-flex')
    expect(pill?.className).toContain('text-[10px]')
  })
})
