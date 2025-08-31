'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Language, getTranslations, detectBrowserLanguage } from '../lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslations>
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession()
  const [language, setLanguageState] = useState<Language>('en')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // For now, use browser language detection or localStorage
    const savedLang = localStorage.getItem('preferred-language') as Language
    if (savedLang && ['en', 'pt'].includes(savedLang)) {
      setLanguageState(savedLang)
    } else {
      const browserLang = detectBrowserLanguage()
      setLanguageState(browserLang)
    }
    setIsLoading(false)
  }, [])

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang)
    
    // Store in localStorage
    localStorage.setItem('preferred-language', lang)
    
    // Update user language in database if user is logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/user/language', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ language: lang }),
        })
      } catch (error) {
        console.error('Failed to update language preference:', error)
      }
    }
  }

  const t = getTranslations(language)

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
