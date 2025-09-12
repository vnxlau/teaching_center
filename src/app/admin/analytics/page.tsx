'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import Breadcrumb from '@/components/Breadcrumb'
import { useLanguage } from '@/contexts/LanguageContext'

interface AnalyticsData {
  overview: {
    totalStudents: number
    activeStudents: number
    totalStaff: number
    totalParents: number
    monthlyRevenue: number
    pendingPayments: number
  }
  performance: {
    averageGrade: number
    passRate: number
    topPerformers: Array<{
      id: string
      name: string
      average: number
    }>
    strugglingStudents: Array<{
      id: string
      name: string
      average: number
    }>
  }
  attendance: {
    overallRate: number
    monthlyTrend: Array<{
      month: string
      rate: number
    }>
  }
  financial: {
    totalRevenue: number
    pendingAmount: number
    overdueAmount: number
    paymentMethods: Array<{
      method: string
      count: number
      amount: number
    }>
  }
  recentActivity: Array<{
    id: string
    type: 'ENROLLMENT' | 'PAYMENT' | 'TEST' | 'MESSAGE'
    description: string
    timestamp: string
    user: string
  }>
}

export default function AdminAnalytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('month')

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user?.role !== 'ADMIN') {
      router.push('/auth/signin')
      return
    }

    fetchAnalyticsData()
  }, [session, status, router, fetchAnalyticsData])

  const breadcrumbItems = [
    { label: t.homeTitle, href: '/' },
    { label: t.admin, href: '/admin/dashboard' },
    { label: t.analytics }
  ]

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t.analyticsDashboard}</h2>
            <p className="text-gray-600 mt-2">{t.comprehensiveInsights}</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'quarter')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="week">{t.lastWeek}</option>
              <option value="month">{t.lastMonth}</option>
              <option value="quarter">{t.lastQuarter}</option>
            </select>
            <Link
              href="/admin/dashboard"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t.backToDashboard}
            </Link>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text={t.loadingAnalytics} />
          </div>
        ) : !analyticsData ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noAnalyticsData}</h3>
            <p className="text-gray-600">{t.unableToLoadAnalytics}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.totalStudents}</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.activeStudents}</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.activeStudents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.staffMembers}</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalStaff}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.parents}</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalParents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.monthlyRevenue}</p>
                    <p className="text-2xl font-bold text-gray-900">€{analyticsData.overview.monthlyRevenue}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.pendingPayments}</p>
                    <p className="text-2xl font-bold text-gray-900">€{analyticsData.overview.pendingPayments}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance & Financial Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Academic Performance */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t.academicPerformance}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{t.averageGrade}</span>
                    <span className="text-xl font-bold text-gray-900">{analyticsData.performance.averageGrade}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{t.passRate}</span>
                    <span className="text-xl font-bold text-green-600">{analyticsData.performance.passRate}%</span>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t.topPerformers}</h4>
                    <div className="space-y-2">
                      {analyticsData.performance.topPerformers.map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {index + 1}. {student.name}
                          </span>
                          <span className="text-sm font-medium text-green-600">{student.average}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t.financialSummary}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{t.totalRevenue}</span>
                    <span className="text-xl font-bold text-green-600">€{analyticsData.financial.totalRevenue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{t.pendingAmount}</span>
                    <span className="text-xl font-bold text-yellow-600">€{analyticsData.financial.pendingAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">{t.overdueAmount}</span>
                    <span className="text-xl font-bold text-red-600">€{analyticsData.financial.overdueAmount}</span>
                  </div>
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t.paymentMethods}</h4>
                    <div className="space-y-2">
                      {analyticsData.financial.paymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{method.method}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {method.count} (€{method.amount})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{t.recentActivity}</h3>
              </div>
              <div className="p-6">
                {analyticsData.recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <p className="text-gray-600">{t.noRecentActivity}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analyticsData.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full ${
                          activity.type === 'ENROLLMENT' ? 'bg-blue-500' :
                          activity.type === 'PAYMENT' ? 'bg-green-500' :
                          activity.type === 'TEST' ? 'bg-purple-500' :
                          'bg-yellow-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500">
                            by {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          activity.type === 'ENROLLMENT' ? 'bg-blue-100 text-blue-800' :
                          activity.type === 'PAYMENT' ? 'bg-green-100 text-green-800' :
                          activity.type === 'TEST' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
