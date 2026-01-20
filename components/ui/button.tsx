import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-white text-[#0A0A0A] shadow hover:bg-white/90',
        destructive:
          'bg-red-500/20 text-red-400 shadow-sm hover:bg-red-500/30',
        outline:
          'border border-white/20 bg-transparent text-white shadow-sm hover:bg-white/5 hover:border-white/30',
        secondary:
          'bg-[#171717] text-white shadow-sm hover:bg-[#171717]/80',
        ghost: 'text-white/70 hover:bg-white/5 hover:text-white',
        link: 'text-[#34D399] underline-offset-4 hover:underline',
        success: 'bg-[#34D399] text-[#0A0A0A] shadow-sm hover:bg-[#34D399]/90',
        warning: 'bg-amber-500/20 text-amber-400 shadow-sm hover:bg-amber-500/30',
        emerald: 'bg-[#34D399]/15 text-[#34D399] hover:bg-[#34D399]/25',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-lg px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
