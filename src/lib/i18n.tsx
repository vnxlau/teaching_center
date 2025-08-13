'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Supported locales
export const locales = ['en', 'pt'] as const
export type Locale = typeof locales[number]

// Language names for display
export const languageNames: Record<Locale, string> = {
  en: 'English',
  pt: 'Português'
}

// Type for translation messages
type Messages = Record<string, any>

// Load messages function
async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    const messages = await import(`../messages/${locale}.json`)
    return messages.default
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error)
    // Fallback to English
    try {
      const fallback = await import(`../messages/en.json`)
      return fallback.default
    } catch (fallbackError) {
      console.error('Failed to load fallback messages:', fallbackError)
      return {}
    }
  }
}

// I18n Context
interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Messages
  t: (key: string, values?: Record<string, any>) => string
  isLoading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

// Translation function
function translateMessage(messages: Messages, key: string, values?: Record<string, any>): string {
  const keys = key.split('.')
  let result: any = messages

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k]
    } else {
      console.warn(`Translation key not found: ${key}`)
      return key // Return the key itself if not found
    }
  }

  if (typeof result !== 'string') {
    console.warn(`Translation result is not a string for key: ${key}`)
    return key
  }

  // Simple interpolation for {variable} patterns
  if (values) {
    return result.replace(/\{(\w+)\}/g, (match: string, variable: string) => {
      return values[variable]?.toString() || match
    })
  }

  return result
}

// I18n Provider Component
interface I18nProviderProps {
  children: ReactNode
  defaultLocale?: Locale
}

export function I18nProvider({ children, defaultLocale = 'en' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [messages, setMessages] = useState<Messages>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load messages when locale changes
  useEffect(() => {
    const loadAndSetMessages = async () => {
      setIsLoading(true)
      const newMessages = await loadMessages(locale)
      setMessages(newMessages)
      setIsLoading(false)
    }

    loadAndSetMessages()
  }, [locale])

  // Load saved locale from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('teaching-center-locale') as Locale
      if (savedLocale && locales.includes(savedLocale)) {
        setLocaleState(savedLocale)
      }
    }
  }, [])

  // Save locale to localStorage when it changes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem('teaching-center-locale', newLocale)
    }
  }

  // Translation function
  const t = (key: string, values?: Record<string, any>) => {
    return translateMessage(messages, key, values)
  }

  const value: I18nContextType = {
    locale,
    setLocale,
    messages,
    t,
    isLoading
  }

  return React.createElement(
    I18nContext.Provider,
    { value },
    children
  )
}

// Hook to use i18n
export function useTranslation() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}

// Hook for just the translation function (most common use case)
export function useI18n() {
  const { t, locale, setLocale, isLoading } = useTranslation()
  return { t, locale, setLocale, isLoading }
}
