'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ChildData {
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
    }
    score: number
    notes: string
  }>
  upcomingTests: Array<{
    title: string
    subject: string
    scheduledDate: string
  }>
  paymentStatus: {
    pending: number
    overdue: number
  }
}

export default function ParentDashboard() {
  const { data: session } = useSession()
  const [children, setChildren] = useState<ChildData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChildrenData()
  }, [])

  const fetchChildrenData = async () => {
    try {
      const response = await fetch('/api/parent/dashboard')
      if (response.ok) {
        const data = await response.json()
        setChildren(data.children || [])
      }
    } catch (error) {
      console.error('Failed to fetch children data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading session...</p>
      </div>
    )
  }

  return (
    <>
      {loading ? (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm text-white p-6">
            <h2 className="text-2xl font-bold mb-2">Welcome back, {session.user.name}! 👨‍👩‍👧‍👦</h2>
            <p className="text-green-100">
              Track your {children.length === 1 ? "child's" : "children's"} academic progress and stay connected with the teaching center.
            </p>
          </div>

            {children.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">👨‍👩‍👧‍👦</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
                <p className="text-gray-600">
                  No student records are associated with your account. Please contact the teaching center administration.
                </p>
              </div>
            ) : (
              children.map((child) => (
                <div key={child.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Child Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-bold text-lg">
                          {child.firstName[0]}{child.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {child.firstName} {child.lastName}
                        </h3>
                        <p className="text-gray-600">
                          Student ID: {child.studentCode} • Grade: {child.grade}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats for this child */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Link href="/parent/tests" className="block bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">Recent Tests</p>
                          <p className="text-lg font-bold text-blue-900">{child.recentGrades?.length || 0}</p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/parent/tests" className="block bg-green-50 rounded-lg p-4 hover:bg-green-100 transition-colors">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">Upcoming Tests</p>
                          <p className="text-lg font-bold text-green-900">{child.upcomingTests?.length || 0}</p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/parent/payments" className="block bg-yellow-50 rounded-lg p-4 hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-600">Pending Payments</p>
                          <p className="text-lg font-bold text-yellow-900">{child.paymentStatus?.pending || 0}</p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Grades */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">📊 Recent Test Results</h4>
                      {child.recentGrades && child.recentGrades.length > 0 ? (
                        <div className="space-y-3">
                          {child.recentGrades.slice(0, 3).map((grade, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{grade.test.title}</p>
                                <p className="text-gray-600 text-xs">{grade.test.subject}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900">
                                  {grade.score}/{grade.test.maxScore}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {Math.round((grade.score / grade.test.maxScore) * 100)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No recent test results available.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Parent-specific features notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Parent Portal</h3>
                  <p className="mt-1 text-sm text-green-700">
                    Welcome to your parent portal. Here you can monitor your {children.length === 1 ? "child's" : "children's"} academic progress, 
                    view upcoming tests, and stay informed about their learning journey.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
