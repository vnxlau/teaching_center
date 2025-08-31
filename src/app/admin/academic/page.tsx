'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/Modal'
import SubjectSelect from '@/components/SubjectSelect'

interface Test {
  id: string
  title: string
  subject: {
    id: string
    name: string
    description?: string
    code?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  } | string // Support both object and string for backward compatibility
  scheduledDate: string
  maxScore: number
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' // Made optional
  participantCount?: number // Made optional
  averageScore?: number
}

interface TeachingPlan {
  id: string
  studentName?: string // Legacy field for backward compatibility
  studentCode?: string // Legacy field for backward compatibility
  subjects: string[] | Array<{
    subject?: {
      name: string
    }
    name?: string
  }>
  goals: string
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  createdDate: string
  progress: number
  student?: {
    firstName: string
    lastName: string
    studentCode: string
  }
}

interface AcademicStats {
  totalTests: number
  upcomingTests: number
  completedTests: number
  activeTeachingPlans: number
  totalSubjects: number
  averageTestScore: number
}

interface Subject {
  id: string
  name: string
  description?: string
  code?: string
  isActive: boolean
  createdAt: string
  _count?: {
    tests: number
    teachingPlans: number
  }
}

export default function AcademicManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tests, setTests] = useState<Test[]>([])
  const [teachingPlans, setTeachingPlans] = useState<TeachingPlan[]>([])
  const [stats, setStats] = useState<AcademicStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tests' | 'plans' | 'subjects'>('tests')
  const [searchTerm, setSearchTerm] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<{ id: string, name: string, studentCode: string }[]>([])
  const [schoolYears, setSchoolYears] = useState<{ id: string, name: string }[]>([])
  const [newSubject, setNewSubject] = useState({
    name: '',
    description: '',
    code: ''
  })
  const [newTest, setNewTest] = useState({
    title: '',
    subject: '',
    scheduledDate: '',
    maxScore: '',
    schoolYearId: ''
  })
  const [newPlan, setNewPlan] = useState({
    studentId: '',
    subjects: [] as string[],
    goals: '',
    schoolYearId: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
      router.push('/auth/signin')
      return
    }

    fetchAcademicData()
    fetchSubjects()
  }, [session, status, router])

  const fetchAcademicData = async () => {
    try {
      const response = await fetch('/api/admin/academic')
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests || [])
        setTeachingPlans(data.teachingPlans || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch academic data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects')
      if (response.ok) {
        const data = await response.json()
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  const fetchStudentsAndYears = async () => {
    try {
      const [studentsRes, yearsRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/school-years')
      ])
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData.students || [])
      }
      
      if (yearsRes.ok) {
        const yearsData = await yearsRes.json()
        setSchoolYears(yearsData.schoolYears || [])
      } else {
        // Fallback if school years API doesn't exist
        setSchoolYears([{ id: 'default', name: 'Current Year' }])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setSchoolYears([{ id: 'default', name: 'Current Year' }])
    }
  }

  const createTest = async () => {
    if (!newTest.title || !newTest.subject || !newTest.scheduledDate || !newTest.maxScore) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/admin/academic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          data: {
            title: newTest.title,
            subject: newTest.subject,
            scheduledDate: newTest.scheduledDate,
            maxScore: parseInt(newTest.maxScore),
            schoolYearId: newTest.schoolYearId || schoolYears[0]?.id
          }
        })
      })

      if (response.ok) {
        setNewTest({
          title: '',
          subject: '',
          scheduledDate: '',
          maxScore: '',
          schoolYearId: ''
        })
        setShowTestModal(false)
        fetchAcademicData()
        alert('Test scheduled successfully!')
      } else {
        alert('Failed to schedule test')
      }
    } catch (error) {
      console.error('Failed to create test:', error)
      alert('Failed to schedule test')
    }
  }

  const createTeachingPlan = async () => {
    if (!newPlan.studentId || !newPlan.goals || newPlan.subjects.length === 0) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/admin/academic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'teaching_plan',
          data: {
            studentId: newPlan.studentId,
            subjects: newPlan.subjects,
            goals: newPlan.goals,
            schoolYearId: newPlan.schoolYearId || schoolYears[0]?.id
          }
        })
      })

      if (response.ok) {
        setNewPlan({
          studentId: '',
          subjects: [],
          goals: '',
          schoolYearId: ''
        })
        setShowPlanModal(false)
        fetchAcademicData()
        alert('Teaching plan created successfully!')
      } else {
        alert('Failed to create teaching plan')
      }
    } catch (error) {
      console.error('Failed to create teaching plan:', error)
      alert('Failed to create teaching plan')
    }
  }

  const openTestModal = () => {
    fetchStudentsAndYears()
    setShowTestModal(true)
  }

  const openPlanModal = () => {
    fetchStudentsAndYears()
    setShowPlanModal(true)
  }

  const createSubject = async () => {
    if (!newSubject.name.trim()) {
      alert('Subject name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSubject.name.trim(),
          description: newSubject.description.trim(),
          code: newSubject.code.trim().toUpperCase() || undefined
        })
      })

      if (response.ok) {
        setNewSubject({ name: '', description: '', code: '' })
        setShowSubjectModal(false)
        fetchSubjects()
        alert('Subject created successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create subject')
      }
    } catch (error) {
      console.error('Failed to create subject:', error)
      alert('Failed to create subject')
    }
  }

  const deleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSubjects()
        alert('Subject deleted successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete subject')
      }
    } catch (error) {
      console.error('Failed to delete subject:', error)
      alert('Failed to delete subject')
    }
  }

  const toggleSubjectStatus = async (subjectId: string) => {
    try {
      // First get the current subject to know its current status
      const currentSubject = subjects.find(s => s.id === subjectId)
      if (!currentSubject) return

      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentSubject.isActive })
      })

      if (response.ok) {
        fetchSubjects()
        // Show success notification instead of alert
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        notification.textContent = `Subject ${!currentSubject.isActive ? 'activated' : 'deactivated'} successfully!`
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 3000)
      } else {
        const error = await response.json()
        // Show error notification instead of alert
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
        notification.textContent = error.error || 'Failed to update subject'
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to toggle subject status:', error)
      // Show error notification instead of alert
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.textContent = 'Failed to update subject'
      document.body.appendChild(notification)
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 3000)
    }
  }

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/' })
  }

  const filteredTests = tests.filter(test => {
    const subjectName = typeof test.subject === 'string' ? test.subject : test.subject.name
    return test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const filteredPlans = teachingPlans.filter(plan => {
    const studentName = plan.studentName || (plan.student?.firstName + ' ' + plan.student?.lastName) || ''
    const studentCode = plan.studentCode || plan.student?.studentCode || ''
    const subjects = plan.subjects || []
    
    return studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
           subjects.some(subject => {
             const subjectName = typeof subject === 'string' ? subject : (subject.subject?.name || subject.name || '')
             return subjectName.toLowerCase().includes(searchTerm.toLowerCase())
           })
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Academic Overview</h2>
              <p className="text-gray-600 mt-2">Manage tests, teaching plans, and academic progress</p>
            </div>
            <div className="flex space-x-3">
              {activeTab === 'tests' && (
                <button 
                  onClick={openTestModal}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule Test
                </button>
              )}
              {activeTab === 'plans' && (
                <button 
                  onClick={openPlanModal}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Teaching Plan
                </button>
              )}
              {activeTab === 'subjects' && (
                <button 
                  onClick={() => setShowSubjectModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Subject
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Academic Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalTests || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming Tests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.upcomingTests || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Teaching Plans</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeTeachingPlans || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageTestScore?.toFixed(1) || '0.0'}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tests & Assessments
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'plans'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Teaching Plans
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subjects'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Subjects
              </button>
            </nav>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeTab === 'tests' 
                  ? 'Search tests by title or subject...' 
                  : activeTab === 'plans'
                  ? 'Search teaching plans by student or subject...'
                  : 'Search subjects by name or code...'
              }
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Content based on active tab */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading academic data...</p>
          </div>
        ) : activeTab === 'tests' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredTests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by scheduling your first test.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Test Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schedule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Results
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{test.title}</div>
                            <div className="text-sm text-gray-500">Max Score: {test.maxScore} pts</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {typeof test.subject === 'string' ? test.subject : test.subject.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(test.scheduledDate).toLocaleDateString()} at{' '}
                          {new Date(test.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(test.status || 'SCHEDULED')}`}>
                            {test.status || 'SCHEDULED'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>Participants: {test.participantCount || 0}</div>
                            {test.averageScore && (
                              <div className="text-gray-500">Avg: {test.averageScore.toFixed(1)}%</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">View</button>
                            <button className="text-blue-600 hover:text-blue-900">Edit</button>
                            <button className="text-green-600 hover:text-green-900">Results</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'subjects' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {(subjects || []).length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Found</h3>
                <p className="text-gray-600">
                  Get started by creating your first subject for the teaching center.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tests Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(subjects || []).filter(subject => 
                      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (subject.description && subject.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (subject.code && subject.code.toLowerCase().includes(searchTerm.toLowerCase()))
                    ).map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                            {subject.description && (
                              <div className="text-sm text-gray-500 max-w-xs truncate" title={subject.description}>
                                {subject.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {subject.code ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {subject.code}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subject.isActive 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {subject.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {subject._count?.tests || 0} tests
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subject.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">Edit</button>
                            <button 
                              onClick={() => toggleSubjectStatus(subject.id)}
                              className={`${
                                subject.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {subject.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredPlans.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">📚</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Teaching Plans Found</h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'Create teaching plans to track student progress.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subjects
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Goals
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {plan.studentName || (plan.student ? `${plan.student.firstName} ${plan.student.lastName}` : 'Unknown Student')}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {plan.studentCode || plan.student?.studentCode || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {plan.subjects.map((subject, index) => {
                              const subjectName = typeof subject === 'string' ? subject : (subject.subject?.name || subject.name || 'Unknown Subject')
                              return (
                                <span key={index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  {subjectName}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={plan.goals}>
                            {plan.goals}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${plan.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{plan.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(plan.status)}`}>
                            {plan.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button className="text-primary-600 hover:text-primary-900">View</button>
                            <button className="text-blue-600 hover:text-blue-900">Edit</button>
                            <button className="text-green-600 hover:text-green-900">Progress</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      
      {/* Schedule Test Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Schedule New Test"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="testTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Test Title
            </label>
            <input
              type="text"
              id="testTitle"
              value={newTest.title}
              onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Mid-term exam, Quiz 1, etc."
            />
          </div>

          <div>
            <label htmlFor="testSubject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <SubjectSelect
              value={newTest.subject}
              onChange={(value) => setNewTest({ ...newTest, subject: value })}
              placeholder="Select a subject"
              required
            />
          </div>

          <div>
            <label htmlFor="testDate" className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date & Time
            </label>
            <input
              type="datetime-local"
              id="testDate"
              value={newTest.scheduledDate}
              onChange={(e) => setNewTest({ ...newTest, scheduledDate: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Score
            </label>
            <input
              type="number"
              id="maxScore"
              value={newTest.maxScore}
              onChange={(e) => setNewTest({ ...newTest, maxScore: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="100"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setShowTestModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Schedule Test
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Teaching Plan Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title="Create Teaching Plan"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="planStudent" className="block text-sm font-medium text-gray-700 mb-2">
              Student
            </label>
            <select
              id="planStudent"
              value={newPlan.studentId}
              onChange={(e) => setNewPlan({ ...newPlan, studentId: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="planSubjects" className="block text-sm font-medium text-gray-700 mb-2">
              Subjects (comma-separated)
            </label>
            <input
              type="text"
              id="planSubjects"
              value={newPlan.subjects.join(', ')}
              onChange={(e) => setNewPlan({ ...newPlan, subjects: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Mathematics, English, Science"
            />
          </div>

          <div>
            <label htmlFor="planGoals" className="block text-sm font-medium text-gray-700 mb-2">
              Learning Goals
            </label>
            <textarea
              id="planGoals"
              rows={4}
              value={newPlan.goals}
              onChange={(e) => setNewPlan({ ...newPlan, goals: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the learning objectives and goals for this student..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setShowPlanModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createTeachingPlan}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Plan
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Subject Modal */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title="Create New Subject"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name *
            </label>
            <input
              type="text"
              id="subjectName"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Mathematics, English, Science, etc."
              required
            />
          </div>

          <div>
            <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 mb-2">
              Subject Code (Optional)
            </label>
            <input
              type="text"
              id="subjectCode"
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value.toUpperCase() })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="MATH, ENG, SCI, etc."
              maxLength={10}
            />
          </div>

          <div>
            <label htmlFor="subjectDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="subjectDescription"
              rows={3}
              value={newSubject.description}
              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description of the subject..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setShowSubjectModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createSubject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Subject
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
