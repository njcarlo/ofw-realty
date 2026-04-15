import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={twMerge(clsx(
        'px-4 py-2 rounded font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        variant === 'ghost' && 'bg-transparent hover:bg-gray-100',
        className
      ))}
      {...props}
    >
      {children}
    </button>
  )
}
