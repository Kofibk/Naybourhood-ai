import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-[#171717] text-white/70 hover:bg-[#171717]/80',
        destructive:
          'border-transparent bg-red-500/20 text-red-400 shadow hover:bg-red-500/30',
        outline: 'text-foreground border-white/20',
        success:
          'border-transparent bg-[#34D399]/20 text-[#34D399] shadow hover:bg-[#34D399]/30',
        warning:
          'border-transparent bg-amber-500/20 text-amber-400 shadow hover:bg-amber-500/30',
        info:
          'border-transparent bg-blue-500/20 text-blue-400 shadow hover:bg-blue-500/30',
        muted:
          'border-transparent bg-white/10 text-white/60',
        emerald:
          'border-transparent bg-[#34D399]/15 text-[#34D399]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
