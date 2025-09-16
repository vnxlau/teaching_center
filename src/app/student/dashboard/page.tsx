'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import Breadcrumb from '@/components/Breadcrumb'
import Button from '@/components/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import StudentPerformanceChart from '@/components/StudentPerformanceChart'

interface StudentData {
  id: string
  studentCode: string
  firstName: string
  lastName: string
  grade: string
  recentGrades: Array<{
    test: {
      title: string
      subject: string
      maxScore: number
      scheduledDate: string
    }
    score: number
    notes: string
    submittedAt: string
  }>
  upcomingTests: Array<{
    title: string
    subject: string
    scheduledDate: string
  }>
  testCategories: {
    closed: Array<{
      id: string
      title: string
      subject: string
      scheduledDate: string
      maxScore: number
      score: number
      notes?: string
      submittedAt: string
    }>
    done: Array<{
      id: string
      title: string
      subject: string
      scheduledDate: string
      maxScore: number
      submittedAt: string
    }>
    upcoming: Array<{
      id: string
      title: string
      subject: string
      scheduledDate: string
      maxScore: number
    }>
  }
  paymentStatus: {
    pending: number
    overdue: number
  }
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const [activeTestTab, setActiveTestTab] = useState<'closed' | 'done' | 'upcoming'>('closed')

  useEffect(() => {
    fetchStudentData()
  }, [])

  const fetchStudentData = async () => {
    try {
      const response = await fetch('/api/student/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStudentData(data)
      }
    } catch (error) {
      console.error('Failed to fetch student data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="text-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const breadcrumbItems = [
    { label: t.dashboard, href: '/' },
    { label: t.studentDashboard }
  ]

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text={t.loadingDashboard} />
          </div>
        ) : !studentData ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t.studentWelcomeTitle}</h3>
            <p className="text-gray-600">{t.studentWelcomeDescription}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                                    <h2 className="text-2xl font-bold mb-2">{t.welcomeMessage}, {studentData.firstName}!</h2>
                  <p className="text-gray-600 mb-4">
                    {t.studentInfo} - Code: {studentData.studentCode}, Grade: {studentData.grade}
                  </p>
                  <Link href="/student/settings">
                    <Button variant="outline" size="sm" className="bg-white text-blue-600 border-white hover:bg-gray-50">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
                <div className="text-right">
                  <div className="text-3xl mb-2">🎓</div>
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                    {t.active}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2m-2 0v2a2 2 0 002 2h2a2 2 0 002-2v-2m0 0V9a2 2 0 00-2-2H9" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.upcomingTests}</p>
                    <p className="text-2xl font-bold text-gray-900">{studentData.upcomingTests.length}</p>
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
                    <p className="text-sm font-medium text-gray-600">{t.recentGrades}</p>
                    <p className="text-2xl font-bold text-gray-900">{studentData.recentGrades.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.averageScore}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {studentData.recentGrades.length > 0 
                        ? Math.round(studentData.recentGrades.reduce((acc, grade) => 
                            acc + (grade.score / grade.test.maxScore * 100), 0) / studentData.recentGrades.length)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{t.pendingPayments}</p>
                    <p className="text-2xl font-bold text-gray-900">{studentData.paymentStatus.pending}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="mb-8">
              <StudentPerformanceChart
                testScores={studentData.recentGrades.map(grade => ({
                  testTitle: grade.test.title,
                  subject: grade.test.subject,
                  score: grade.score,
                  maxScore: grade.test.maxScore,
                  date: grade.submittedAt
                }))}
              />
            </div>

            {/* Test Categories Section */}
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">My Tests</h3>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    <button
                      onClick={() => setActiveTestTab('closed')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTestTab === 'closed'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Closed ({studentData.testCategories.closed.length})
                    </button>
                    <button
                      onClick={() => setActiveTestTab('done')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTestTab === 'done'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Done ({studentData.testCategories.done.length})
                    </button>
                    <button
                      onClick={() => setActiveTestTab('upcoming')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 ${
                        activeTestTab === 'upcoming'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Upcoming ({studentData.testCategories.upcoming.length})
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTestTab === 'closed' && (
                    <div>
                      {studentData.testCategories.closed.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-2">📊</div>
                          <p className="text-gray-600">No closed tests yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {studentData.testCategories.closed.map((test) => {
                            const percentage = Math.round((test.score / test.maxScore) * 100)
                            return (
                              <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <h4 className="font-medium text-gray-900">{test.title}</h4>
                                  <p className="text-sm text-gray-600">{test.subject}</p>
                                  <p className="text-sm text-gray-500">
                                    Submitted: {new Date(test.submittedAt).toLocaleDateString()}
                                  </p>
                                  {test.notes && (
                                    <p className="text-sm text-gray-500 mt-1">{test.notes}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">
                                    {test.score}/{test.maxScore}
                                  </p>
                                  <p className={`text-sm font-medium ${
                                    percentage >= 80 ? 'text-green-600' : 
                                    percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {percentage}%
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTestTab === 'done' && (
                    <div>
                      {studentData.testCategories.done.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-2">✅</div>
                          <p className="text-gray-600">No completed tests waiting for grading</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {studentData.testCategories.done.map((test) => (
                            <div key={test.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{test.title}</h4>
                                <p className="text-sm text-gray-600">{test.subject}</p>
                                <p className="text-sm text-gray-500">
                                  Submitted: {new Date(test.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Awaiting Grade
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTestTab === 'upcoming' && (
                    <div>
                      {studentData.testCategories.upcoming.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-2">📅</div>
                          <p className="text-gray-600">No upcoming tests scheduled</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {studentData.testCategories.upcoming.map((test) => (
                            <div key={test.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{test.title}</h4>
                                <p className="text-sm text-gray-600">{test.subject}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(test.scheduledDate).toLocaleDateString()} {t.at}{' '}
                                  {new Date(test.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Scheduled
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Tests */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{t.upcomingTests}</h3>
                </div>
                <div className="p-6">
                  {studentData.upcomingTests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📝</div>
                      <p className="text-gray-600">{t.noUpcomingTests}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentData.upcomingTests.slice(0, 3).map((test, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{test.title}</h4>
                            <p className="text-sm text-gray-600">{test.subject}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(test.scheduledDate).toLocaleDateString()} {t.at}{' '}
                              {new Date(test.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {test.subject}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Grades */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{t.recentGrades}</h3>
                </div>
                <div className="p-6">
                  {studentData.recentGrades.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📊</div>
                      <p className="text-gray-600">{t.noRecentGrades}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentData.recentGrades.slice(0, 3).map((grade, index) => {
                        const percentage = Math.round((grade.score / grade.test.maxScore) * 100)
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{grade.test.title}</h4>
                              <p className="text-sm text-gray-600">{grade.test.subject}</p>
                              {grade.notes && (
                                <p className="text-sm text-gray-500 mt-1">{grade.notes}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {grade.score}/{grade.test.maxScore}
                              </p>
                              <p className={`text-sm font-medium ${
                                percentage >= 80 ? 'text-green-600' : 
                                percentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {percentage}%
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
