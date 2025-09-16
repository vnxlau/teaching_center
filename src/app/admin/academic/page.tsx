'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/Modal'
import SubjectSelect from '@/components/SubjectSelect'
import { useLanguage } from '@/contexts/LanguageContext'

interface TestResult {
  id: string
  testId: string
  studentId: string
  score: number
  notes?: string
  createdAt: string
  updatedAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentCode: string
    user: {
      email: string
    }
  }
}

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
  results?: TestResult[]
}

interface AcademicStats {
  totalTests: number
  upcomingTests: number
  completedTests: number
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
  const { t } = useLanguage()
  const [tests, setTests] = useState<Test[]>([])
  const [stats, setStats] = useState<AcademicStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tests' | 'subjects'>('tests')
  const [searchTerm, setSearchTerm] = useState('')
  const [showTestModal, setShowTestModal] = useState(false)
  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [showTestResultsModal, setShowTestResultsModal] = useState(false)
  const [selectedTestForResults, setSelectedTestForResults] = useState<Test | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [assignedStudents, setAssignedStudents] = useState<any[]>([])
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
    subjectId: '',
    scheduledDate: '',
    maxScore: '100',
    schoolYearId: '',
    selectedStudents: [] as string[]
  })
  const [studentSearchTerm, setStudentSearchTerm] = useState('')

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())

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
    fetchStudentsAndYears() // Load students and school years on component mount
  }, [session, status, router])

  const fetchAcademicData = async () => {
    try {
      const response = await fetch('/api/admin/academic')
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests || [])
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
      console.log('Fetching students and school years...')
      const [studentsRes, yearsRes] = await Promise.all([
        fetch('/api/admin/students'),
        fetch('/api/admin/school-years')
      ])
      
      console.log('Students response:', studentsRes.status, studentsRes.ok)
      console.log('School years response:', yearsRes.status, yearsRes.ok)
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        console.log('Students data:', studentsData)
        setStudents(studentsData.students || [])
      } else {
        console.error('Failed to fetch students:', await studentsRes.text())
      }
      
      if (yearsRes.ok) {
        const yearsData = await yearsRes.json()
        console.log('School years data:', yearsData)
        setSchoolYears(yearsData.schoolYears || [])
      } else {
        console.error('Failed to fetch school years:', await yearsRes.text())
        // Fallback if school years API doesn't exist
        setSchoolYears([{ id: 'default', name: 'Current Year' }])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setSchoolYears([{ id: 'default', name: 'Current Year' }])
    }
  }

  const createTest = async () => {
    if (!newTest.title || !newTest.subjectId || !newTest.scheduledDate || !newTest.maxScore) {
      alert('Please fill in all fields')
      return
    }

    // Ensure we have required data
    const schoolYearId = newTest.schoolYearId || schoolYears[0]?.id
    const staffId = session?.user?.staffId || session?.user?.id

    if (!schoolYearId) {
      alert('No school year available. Please contact administrator.')
      return
    }

    if (!staffId) {
      alert('User session invalid. Please sign in again.')
      return
    }

    const testData = {
      type: 'test',
      title: newTest.title,
      subjectId: newTest.subjectId,
      scheduledDate: newTest.scheduledDate,
      maxScore: parseInt(newTest.maxScore),
      schoolYearId,
      staffId
    }

    console.log('Sending test data:', testData)
    console.log('Session user:', session?.user)
    console.log('School years:', schoolYears)

    try {
      const response = await fetch('/api/admin/academic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      if (response.ok) {
        const createdTest = await response.json()
        
        // Assign selected students to the test
        if (newTest.selectedStudents.length > 0) {
          try {
            const assignResponse = await fetch('/api/admin/test-students', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                testId: createdTest.id,
                studentIds: newTest.selectedStudents
              })
            })
            
            if (!assignResponse.ok) {
              console.error('Failed to assign students to test')
              alert('Test created but failed to assign some students. Please assign them manually.')
            }
          } catch (assignError) {
            console.error('Error assigning students:', assignError)
            alert('Test created but failed to assign students. Please assign them manually.')
          }
        }
        
        setNewTest({
          title: '',
          subjectId: '',
          scheduledDate: '',
          maxScore: '100',
          schoolYearId: '',
          selectedStudents: []
        })
        setShowTestModal(false)
        fetchAcademicData()
        alert('Test scheduled successfully!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to schedule test')
      }
    } catch (error) {
      console.error('Failed to create test:', error)
      alert('Failed to schedule test')
    }
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

  const openTestResultsModal = async (test: Test) => {
    setSelectedTestForResults(test)
    setShowTestResultsModal(true)

    try {
      // Fetch test results
      const resultsResponse = await fetch(`/api/admin/test-results?testId=${test.id}`)
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setTestResults(resultsData.results || [])
      }

      // Fetch available students
      const studentsResponse = await fetch(`/api/admin/test-students?testId=${test.id}`)
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setAvailableStudents(studentsData.availableStudents || [])
        setAssignedStudents(studentsData.assignedStudents || [])
      }
    } catch (error) {
      console.error('Failed to fetch test results data:', error)
    }
  }

  const addStudentsToTest = async (studentIds: string[]) => {
    if (!selectedTestForResults) return

    try {
      const response = await fetch('/api/admin/test-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: selectedTestForResults.id,
          studentIds
        })
      })

      if (response.ok) {
        const newResults = await response.json()
        setTestResults(prev => [...prev, ...newResults])
        // Refresh available students
        const studentsResponse = await fetch(`/api/admin/test-students?testId=${selectedTestForResults.id}`)
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setAvailableStudents(studentsData.availableStudents || [])
          setAssignedStudents(studentsData.assignedStudents || [])
        }
        alert('Students added to test successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add students to test')
      }
    } catch (error) {
      console.error('Failed to add students to test:', error)
      alert('Failed to add students to test')
    }
  }

  const updateTestResult = async (studentId: string, score: number, notes: string) => {
    if (!selectedTestForResults) return

    try {
      const response = await fetch('/api/admin/test-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: selectedTestForResults.id,
          studentId,
          score,
          notes
        })
      })

      if (response.ok) {
        const updatedResult = await response.json()
        setTestResults(prev =>
          prev.map(result =>
            result.studentId === studentId ? updatedResult : result
          )
        )
        alert('Test result updated successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update test result')
      }
    } catch (error) {
      console.error('Failed to update test result:', error)
      alert('Failed to update test result')
    }
  }

  const removeStudentFromTest = async (studentId: string) => {
    if (!selectedTestForResults) return

    if (!confirm('Are you sure you want to remove this student from the test? This will delete their result.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/test-results?testId=${selectedTestForResults.id}&studentId=${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTestResults(prev => prev.filter(result => result.studentId !== studentId))
        // Refresh available students
        const studentsResponse = await fetch(`/api/admin/test-students?testId=${selectedTestForResults.id}`)
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          setAvailableStudents(studentsData.availableStudents || [])
          setAssignedStudents(studentsData.assignedStudents || [])
        }
        alert('Student removed from test successfully!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to remove student from test')
      }
    } catch (error) {
      console.error('Failed to remove student from test:', error)
      alert('Failed to remove student from test')
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

  const openTestModal = (selectedDate?: Date) => {
    // Use selected date or default to current date at 10:00
    const baseDate = selectedDate || new Date()
    const defaultDateTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 10, 0, 0)
    const formattedDateTime = defaultDateTime.toISOString().slice(0, 16) // Format for datetime-local input

    setNewTest({
      title: '',
      subjectId: '',
      scheduledDate: formattedDateTime,
      maxScore: '100',
      schoolYearId: schoolYears[0]?.id || '',
      selectedStudents: []
    })
    setStudentSearchTerm('')
    fetchStudentsAndYears()
    setShowTestModal(true)
  }

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

  const getTestStats = (test: Test) => {
    const results = test.results || []
    const participantCount = results.length
    const scores = results
      .map(result => result.score)
      .filter(score => score !== null && score !== undefined && !isNaN(score))

    const averageScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null

    return {
      participantCount,
      averageScore: averageScore ? (averageScore / test.maxScore) * 100 : null
    }
  }

  // Calendar functions
  const getTestsForDate = (date: Date) => {
    return tests.filter(test => {
      const testDate = new Date(test.scheduledDate)
      return testDate.toDateString() === date.toDateString()
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calendar Component
  const TestCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())) // End on Saturday

    const calendarDays = []
    const current = new Date(startDate)

    while (current <= endDate) {
      calendarDays.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Test Calendar - {monthNames[month]} {year}
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => {
            const dayTests = getTestsForDate(date)
            const isCurrentMonth = date.getMonth() === month
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => openTestModal(date)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayTests.slice(0, 3).map((test) => (
                    <div
                      key={test.id}
                      className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                      title={`${test.title} - ${typeof test.subject === 'string' ? test.subject : test.subject.name}`}
                      onClick={(e) => {
                        e.stopPropagation() // Prevent triggering the day cell click
                        openTestResultsModal(test)
                      }}
                    >
                      {test.title}
                    </div>
                  ))}
                  {dayTests.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayTests.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
              <span>Click tests to view results</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 ring-2 ring-blue-500 rounded mr-2"></div>
              <span>Today - Click any day to schedule a test</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // TestResultRow Component
  const TestResultRow = ({
    result,
    maxScore,
    onUpdate,
    onRemove
  }: {
    result: TestResult
    maxScore: number
    onUpdate: (score: number, notes: string) => void
    onRemove: () => void
  }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [editScore, setEditScore] = useState(result.score?.toString() || '')
    const [editNotes, setEditNotes] = useState(result.notes || '')

    const handleSave = () => {
      const score = parseFloat(editScore)
      if (isNaN(score) || score < 0 || score > maxScore) {
        alert(`Score must be a number between 0 and ${maxScore}`)
        return
      }
      onUpdate(score, editNotes)
      setIsEditing(false)
    }

    const handleCancel = () => {
      setEditScore(result.score?.toString() || '')
      setEditNotes(result.notes || '')
      setIsEditing(false)
    }

    const percentage = result.score && maxScore ? ((result.score / maxScore) * 100).toFixed(1) : '0.0'

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <div className="text-sm font-medium text-gray-900">
              {result.student.firstName} {result.student.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {result.student.studentCode} • {result.student.user.email}
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {isEditing ? (
            <input
              type="number"
              value={editScore}
              onChange={(e) => setEditScore(e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              min="0"
              max={maxScore}
              step="0.5"
            />
          ) : (
            <span className="text-sm font-medium text-gray-900">
              {result.score || 'Not graded'}
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            parseFloat(percentage) >= 80 ? 'bg-green-100 text-green-800' :
            parseFloat(percentage) >= 60 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {percentage}%
          </span>
        </td>
        <td className="px-6 py-4">
          {isEditing ? (
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              rows={2}
              placeholder="Add notes about the student's performance..."
            />
          ) : (
            <span className="text-sm text-gray-600">
              {result.notes || 'No notes'}
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="text-green-600 hover:text-green-900 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={onRemove}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    )
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
              <h2 className="text-3xl font-bold text-gray-900">{t.academicManagement}</h2>
              <p className="text-gray-600 mt-2">Manage tests, subjects, and academic progress</p>
            </div>
            <div className="flex space-x-3">
              {activeTab === 'tests' && (
                <button 
                  onClick={() => openTestModal()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t.scheduleTest || 'Schedule Test'}
                </button>
              )}
              {activeTab === 'subjects' && (
                <button 
                  onClick={() => setShowSubjectModal(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t.createSubject || 'Create Subject'}
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
                  <p className="text-sm font-medium text-gray-600">{t.totalTests}</p>
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
                  <p className="text-sm font-medium text-gray-600">{t.upcomingTests}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.upcomingTests || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">{t.avgScore} Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageTestScore?.toFixed(1) || '0.0'}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Calendar */}
        <TestCalendar />

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
                {t.testsTab}
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
                  ? `${t.search} ${t.tests?.toLowerCase() || 'tests'} ${t.name?.toLowerCase() || 'by title'} ${t.subject?.toLowerCase() || 'or subject'}...` 
                  : `${t.search} ${t.subjects?.toLowerCase() || 'subjects'} ${t.name?.toLowerCase() || 'by name'} ${'code'}...`
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
                            <div>Participants: {getTestStats(test).participantCount}</div>
                            {getTestStats(test).averageScore !== null && (
                              <div className="text-gray-500">Avg: {getTestStats(test).averageScore!.toFixed(1)}%</div>
                            )}
                          </div>
                        </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openTestResultsModal(test)}
                            className="text-green-600 hover:text-green-900 px-3 py-1 rounded-md border border-green-600 hover:bg-green-50 transition-colors"
                          >
                            Manage Results
                          </button>
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
        ) : null}
      
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
              value={newTest.subjectId}
              onChange={(value) => setNewTest({ ...newTest, subjectId: value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Students
            </label>
            <div className="space-y-3">
              {/* Student Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  placeholder="Search students by name or code..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Student List */}
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {students
                  .filter(student =>
                    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                    student.studentCode.toLowerCase().includes(studentSearchTerm.toLowerCase())
                  )
                  .map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        newTest.selectedStudents.includes(student.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        const isSelected = newTest.selectedStudents.includes(student.id)
                        if (isSelected) {
                          setNewTest({
                            ...newTest,
                            selectedStudents: newTest.selectedStudents.filter(id => id !== student.id)
                          })
                        } else {
                          setNewTest({
                            ...newTest,
                            selectedStudents: [...newTest.selectedStudents, student.id]
                          })
                        }
                      }}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {student.studentCode}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {newTest.selectedStudents.includes(student.id) && (
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                {students.filter(student =>
                  student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                  student.studentCode.toLowerCase().includes(studentSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No students found
                  </div>
                )}
              </div>

              {/* Selected Count */}
              <div className="text-sm text-gray-600">
                {newTest.selectedStudents.length} student{newTest.selectedStudents.length !== 1 ? 's' : ''} selected
              </div>
            </div>
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

      {/* Test Results Modal */}
      <Modal
        isOpen={showTestResultsModal}
        onClose={() => setShowTestResultsModal(false)}
        title={`Test Results: ${selectedTestForResults?.title || ''}`}
      >
        <div className="max-w-6xl w-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Test Results: {selectedTestForResults?.title}
              </h2>
              <p className="text-gray-600 mt-1">
                Subject: {typeof selectedTestForResults?.subject === 'string'
                  ? selectedTestForResults.subject
                  : selectedTestForResults?.subject.name} |
                Max Score: {selectedTestForResults?.maxScore} pts |
                Date: {selectedTestForResults ? new Date(selectedTestForResults.scheduledDate).toLocaleDateString() : ''}
              </p>
            </div>
            <button
              onClick={() => setShowTestResultsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Add Students Section */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Add Students to Test</h3>
            <div className="flex flex-wrap gap-2">
              {availableStudents.slice(0, 10).map((student) => (
                <button
                  key={student.id}
                  onClick={() => addStudentsToTest([student.id])}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {student.firstName} {student.lastName} ({student.studentCode})
                </button>
              ))}
              {availableStudents.length > 10 && (
                <span className="text-sm text-gray-500 self-center">
                  +{availableStudents.length - 10} more students available
                </span>
              )}
            </div>
            {availableStudents.length === 0 && (
              <p className="text-sm text-gray-600">All active students are already assigned to this test.</p>
            )}
          </div>

          {/* Test Results Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Student Results ({testResults.length} participants)
              </h3>
            </div>

            {testResults.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h4>
                <p className="text-gray-600">Add students to this test to start logging their scores and notes.</p>
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
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testResults.map((result) => (
                      <TestResultRow
                        key={result.id}
                        result={result}
                        maxScore={selectedTestForResults?.maxScore || 0}
                        onUpdate={(score, notes) => updateTestResult(result.studentId, score, notes)}
                        onRemove={() => removeStudentFromTest(result.studentId)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowTestResultsModal(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
