'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import SubjectSelect from '@/components/SubjectSelect'

interface Test {
  id: string
  title: string
  subject: string
  scheduledDate: string
  maxScore: number
  description?: string
  isCompleted: boolean
  result?: {
    score: number
    notes?: string
    submittedAt: string
  }
}

export default function StudentTests() {
  const { data: session } = useSession()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'upcoming'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTest, setNewTest] = useState({
    title: '',
    subjectId: '',
    scheduledDate: '',
    maxScore: '',
    description: ''
  })

  useEffect(() => {
    fetchTests()
  }, [])

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/student/tests')
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

  const createTest = async () => {
    if (!newTest.title || !newTest.subjectId || !newTest.scheduledDate || !newTest.maxScore) {
      alert('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/student/tests', {
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
          description: ''
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

  const filteredTests = tests.filter(test => {
    switch (activeTab) {
      case 'completed':
        return test.isCompleted
      case 'upcoming':
        return !test.isCompleted && new Date(test.scheduledDate) > new Date()
      default:
        return true
    }
  })

  const getTestStatus = (test: Test) => {
    if (test.isCompleted) {
      return { status: 'Completed', color: 'bg-green-100 text-green-800' }
    } else if (new Date(test.scheduledDate) > new Date()) {
      return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' }
    } else {
      return { status: 'Past Due', color: 'bg-red-100 text-red-800' }
    }
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tests & Assessments</h2>
          <p className="text-gray-600 mt-2">View your test results and upcoming assessments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create Test Request
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Tests', count: tests.length },
            { id: 'completed', name: 'Completed', count: tests.filter(t => t.isCompleted).length },
            { id: 'upcoming', name: 'Upcoming', count: tests.filter(t => !t.isCompleted && new Date(t.scheduledDate) > new Date()).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab === 'all' ? '' : activeTab} tests found
          </h3>
          <p className="text-gray-600">
            {activeTab === 'upcoming' 
              ? "You don't have any upcoming tests scheduled."
              : activeTab === 'completed'
              ? "You haven't completed any tests yet."
              : "No tests are currently available."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => {
            const { status, color } = getTestStatus(test)
            return (
              <div key={test.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        📚 {test.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        📅 {new Date(test.scheduledDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱️ {new Date(test.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {test.description && (
                      <p className="text-gray-600 text-sm mb-3">{test.description}</p>
                    )}
                  </div>

                  {/* Score Display */}
                  {test.result && (
                    <div className="text-right ml-6">
                      <div className={`text-2xl font-bold ${getScoreColor(test.result.score, test.maxScore)}`}>
                        {test.result.score}/{test.maxScore}
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round((test.result.score / test.maxScore) * 100)}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Result Details */}
                {test.result && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Test Result</p>
                        <p className="text-xs text-gray-600">
                          Submitted on {new Date(test.result.submittedAt).toLocaleDateString()}
                        </p>
                        {test.result.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Teacher&apos;s Notes:</strong> {test.result.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Upcoming Test Info */}
                {!test.isCompleted && new Date(test.scheduledDate) > new Date() && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Upcoming Test</p>
                        <p className="text-xs text-gray-600">
                          Maximum Score: {test.maxScore} points
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary-600">
                          {Math.ceil((new Date(test.scheduledDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Test Request</h3>
            
            <div className="space-y-4">
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
