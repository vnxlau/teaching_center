// React Query Provider for Performance Optimization
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache time: Data stays in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests
            retry: 2,
            // Refetch on window focus for critical data
            refetchOnWindowFocus: false,
            // Background refetch interval
            refetchInterval: 5 * 60 * 1000, // 5 minutes
          },
          mutations: {
            // Retry failed mutations
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
