'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'dark' | 'light'
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({
  className,
  variant = 'dark',
  showText = true,
  size = 'md'
}: LogoProps) {
  const color = variant === 'dark' ? '#000000' : '#ffffff'

  const sizeClasses = {
    sm: { icon: 'w-8 h-8', text: 'text-sm', gap: 'gap-2' },
    md: { icon: 'w-10 h-10', text: 'text-base', gap: 'gap-3' },
    lg: { icon: 'w-14 h-14', text: 'text-xl', gap: 'gap-4' },
  }

  return (
    <div className={cn('flex items-center', sizeClasses[size].gap, className)}>
      {/* Celtic Knot Icon */}
      <svg
        viewBox="0 0 70 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size].icon}
      >
        {/* Outer loops - top left */}
        <path
          d="M20 8C10 8 3 15 3 25C3 30 5 35 9 38.5C5 42 3 47 3 52C3 62 10 69 20 69C26 69 31 66 35 62C39 66 44 69 50 69C60 69 67 62 67 52C67 47 65 42 61 38.5C65 35 67 30 67 25C67 15 60 8 50 8C44 8 39 11 35 15C31 11 26 8 20 8Z"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Inner curves - left side */}
        <path
          d="M20 16C13 16 9 21 9 27C9 31 11 34 14 37C11 40 9 44 9 48C9 55 13 60 20 60"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Inner curves - right side */}
        <path
          d="M50 16C57 16 61 21 61 27C61 31 59 34 56 37C59 40 61 44 61 48C61 55 57 60 50 60"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Center crossing - top */}
        <path
          d="M20 16C25 16 29 19 32 23L35 27L38 23C41 19 45 16 50 16"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Center crossing - bottom */}
        <path
          d="M20 60C25 60 29 57 32 53L35 49L38 53C41 57 45 60 50 60"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Inner vertical connections */}
        <path
          d="M35 27L35 49"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
        {/* Horizontal center line */}
        <path
          d="M14 38.5L56 38.5"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
        />
      </svg>

      {showText && (
        <span
          className={cn(
            'font-semibold tracking-wider',
            sizeClasses[size].text
          )}
          style={{ color }}
        >
          NAYBOURHOOD
        </span>
      )}
    </div>
  )
}

export function LogoIcon({
  className,
  variant = 'dark'
}: {
  className?: string
  variant?: 'dark' | 'light'
}) {
  const color = variant === 'dark' ? '#000000' : '#ffffff'

  return (
    <svg
      viewBox="0 0 70 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20 8C10 8 3 15 3 25C3 30 5 35 9 38.5C5 42 3 47 3 52C3 62 10 69 20 69C26 69 31 66 35 62C39 66 44 69 50 69C60 69 67 62 67 52C67 47 65 42 61 38.5C65 35 67 30 67 25C67 15 60 8 50 8C44 8 39 11 35 15C31 11 26 8 20 8Z"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M20 16C13 16 9 21 9 27C9 31 11 34 14 37C11 40 9 44 9 48C9 55 13 60 20 60"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M50 16C57 16 61 21 61 27C61 31 59 34 56 37C59 40 61 44 61 48C61 55 57 60 50 60"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M20 16C25 16 29 19 32 23L35 27L38 23C41 19 45 16 50 16"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M20 60C25 60 29 57 32 53L35 49L38 53C41 57 45 60 50 60"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M35 27L35 49"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M14 38.5L56 38.5"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
      />
    </svg>
  )
}
