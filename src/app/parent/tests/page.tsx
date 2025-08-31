'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import SubjectSelect from '@/components/SubjectSelect'

interface Test {
  id: string
  title: string
  subject: string
  maxScore: number
  scheduledDate: string
  status: 'COMPLETED' | 'SCHEDULED' | 'CANCELLED'
  student: {
    id: string
    firstName: string
    lastName: string
    studentCode: string
  }
  grade?: {
    score: number
    notes: string
    gradedAt: string
  }
}

export default function ParentTestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'upcoming'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [children, setChildren] = useState<any[]>([])
  const [newTest, setNewTest] = useState({
    title: '',
    subjectId: '',
    scheduledDate: '',
    maxScore: '',
    description: '',
    studentId: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'PARENT') {
      router.push('/auth/signin')
      return
    }

    fetchTests()
    fetchChildren()
  }, [session, status, router])

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/parent/tests')
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests || [])
      }
    } catch (error) {
      console.error('Failed to fetch tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChildren = async () => {
    try {
      const response = await fetch('/api/parent/students')
      if (response.ok) {
        const data = await response.json()
        setChildren(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch children:', error)
    }
  }

  const createTest = async () => {
    if (!newTest.title || !newTest.subjectId || !newTest.scheduledDate || !newTest.maxScore || !newTest.studentId) {
      alert('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/parent/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTest)
      })

      if (response.ok) {
        setNewTest({
          title: '',
          subjectId: '',
          scheduledDate: '',
          maxScore: '',
          description: '',
          studentId: ''
        })
        setShowCreateModal(false)
        fetchTests()
        alert('Test request created successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create test')
      }
    } catch (error) {
      console.error('Failed to create test:', error)
      alert('Failed to create test')
    } finally {
      setCreating(false)
    }
  }

  const handleSignOut = () => {
    router.push('/auth/signin')
  }

  // Filter tests based on active tab
  const getFilteredTests = () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (activeTab) {
      case 'recent':
        return tests.filter(test => 
          test.status === 'COMPLETED' && 
          new Date(test.scheduledDate) >= thirtyDaysAgo
        )
      case 'upcoming':
        return tests.filter(test => 
          test.status === 'SCHEDULED' && 
          new Date(test.scheduledDate) >= now
        )
      default:
        return tests
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  }

  if (!session || session.user.role !== 'PARENT') {
    return null
  }

  const filteredTests = getFilteredTests()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tests & Assessments</h2>
          <p className="text-gray-600 mt-2">View your children's test results and create test requests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create Test Request
        </button>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests.filter(t => t.status === 'SCHEDULED' && new Date(t.scheduledDate) >= new Date()).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tests.filter(t => t.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 pt-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Tests
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'recent'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recent (30 days)
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-600">
                  {activeTab === 'recent' && 'No recent tests found.'}
                  {activeTab === 'upcoming' && 'No upcoming tests scheduled.'}
                  {activeTab === 'all' && 'No tests found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTests.map((test) => (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{test.title}</h4>
                        <p className="text-sm text-gray-600">
                          Subject: {test.subject} • Student: {test.student.firstName} {test.student.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {new Date(test.scheduledDate).toLocaleDateString()}
                        </p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          test.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800'
                            : test.status === 'SCHEDULED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {test.status.toLowerCase()}
                        </span>
                      </div>
                    </div>
                    
                    {test.grade && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Score: {test.grade.score}/{test.maxScore} ({Math.round((test.grade.score / test.maxScore) * 100)}%)
                            </p>
                            {test.grade.notes && (
                              <p className="text-sm text-gray-600 mt-1">Notes: {test.grade.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Graded: {new Date(test.grade.gradedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Test Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student *
                </label>
                <select
                  value={newTest.studentId}
                  onChange={(e) => setNewTest({ ...newTest, studentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a student</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.firstName} {child.lastName} ({child.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={newTest.title}
                  onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter test title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <SubjectSelect
                  value={newTest.subjectId}
                  onChange={(subjectId: string) => setNewTest({ ...newTest, subjectId })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="datetime-local"
                  value={newTest.scheduledDate}
                  onChange={(e) => setNewTest({ ...newTest, scheduledDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Score *
                </label>
                <input
                  type="number"
                  value={newTest.maxScore}
                  onChange={(e) => setNewTest({ ...newTest, maxScore: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter maximum score"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter test description (optional)"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createTest}
                disabled={creating}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
