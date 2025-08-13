'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t('auth.errors.invalidCredentials'))
      } else {
        // Get the session to check user role
        const session = await getSession()
        
        // Redirect based on user role
        if (session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF') {
          router.push('/admin/dashboard')
        } else if (session?.user?.role === 'STUDENT') {
          router.push('/student/dashboard')
        } else if (session?.user?.role === 'PARENT') {
          router.push('/parent/dashboard')
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      setError(t('auth.errors.general'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Language Switcher */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        
        <div>
          <Link href="/" className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">TC</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{t('home.title')}</span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('auth.signInTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('auth.signInSubtitle')}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('auth.emailLabel')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('auth.passwordLabel')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t('auth.signingIn')}
                  </div>
                ) : (
                  t('common.signIn')
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Demo Accounts */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🔑 {t('auth.demo.title')}</h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="bg-white rounded p-3 border border-blue-100">
              <div className="font-medium text-blue-800">{t('auth.demo.adminAccount')}</div>
              <div className="text-blue-700">admin@teachingcenter.com</div>
              <div className="text-blue-600">{t('auth.demo.password')}: demo123</div>
            </div>
            <div className="bg-white rounded p-3 border border-blue-100">
              <div className="font-medium text-blue-800">{t('auth.demo.studentAccount')}</div>
              <div className="text-blue-700">student1@example.com</div>
              <div className="text-blue-600">{t('auth.demo.password')}: demo123</div>
            </div>
            <div className="bg-white rounded p-3 border border-blue-100">
              <div className="font-medium text-blue-800">{t('auth.demo.parentAccount')}</div>
              <div className="text-blue-700">parent1@example.com</div>
              <div className="text-blue-600">{t('auth.demo.password')}: demo123</div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/" className="text-primary-600 hover:text-primary-500 font-medium">
            ← {t('auth.backToHomepage')}
          </Link>
        </div>
      </div>
    </div>
  )
}
