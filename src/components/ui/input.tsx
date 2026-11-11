import * as React from 'react'
import { cn } from '@/lib/utils'

export const inputClasses =
  'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_hsl(var(--shadow)/0.03)] transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, type = 'text', ...props }, ref) => (
  <input ref={ref} type={type} className={cn(inputClasses, className)} {...props} />
))
Input.displayName = 'Input'
