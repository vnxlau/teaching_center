import React, { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'sm',
  hover = false 
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  const hoverClass = hover ? 'hover:shadow-md transition-shadow duration-200' : ''

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 
        ${paddingClasses[padding]} 
        ${shadowClasses[shadow]} 
        ${hoverClass}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
