'use client'

import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from '@/contexts/LanguageContext'
import QueryProvider from '@/providers/QueryProvider'
import { NotificationProvider } from './NotificationProvider'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <QueryProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </QueryProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}
