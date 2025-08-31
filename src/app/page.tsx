'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import OwlIcon from '@/components/icons/OwlIcon'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, isLoading: i18nLoading } = useLanguage()
  const [schoolName, setSchoolName] = useState('Teaching Center')

  // Fetch school name from system settings
  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const response = await fetch('/api/admin/settings/system')
        if (response.ok) {
          const settings = await response.json()
          setSchoolName(settings.schoolName || 'Teaching Center')
        }
      } catch (error) {
        console.error('Failed to fetch school name:', error)
      }
    }
    
    fetchSchoolName()
    
    // Listen for system settings updates
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail?.schoolName) {
        setSchoolName(event.detail.schoolName)
      } else {
        // Refresh from API if schoolName not in the event detail
        fetchSchoolName()
      }
    }
    
    window.addEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      // Redirect based on user role
      switch (session.user.role) {
        case 'ADMIN':
        case 'STAFF':
          router.push('/admin/dashboard')
          break
        case 'STUDENT':
          router.push('/student/dashboard')
          break
        case 'PARENT':
          router.push('/parent/dashboard')
          break
        default:
          // Unknown role, sign out
          import('next-auth/react').then(({ signOut }) => {
            signOut({ callbackUrl: '/' })
          })
      }
    }
  }, [session, status, router])

  if (status === 'loading' || i18nLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <OwlIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{schoolName}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Link
                href="/auth/signin"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t.signIn}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <OwlIcon className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {t.homeTitle}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.homeSubtitle}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.studentsFeatureTitle}</h3>
              <p className="text-gray-600">
                {t.studentsFeatureDescription}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.parentsFeatureTitle}</h3>
              <p className="text-gray-600">
                {t.parentsFeatureDescription}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.administratorsFeatureTitle}</h3>
              <p className="text-gray-600">
                {t.administratorsFeatureDescription}
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.ctaTitle}</h2>
            <p className="text-gray-600 mb-6">
              {t.ctaDescription}
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              {t.ctaButton}
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>{t.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
