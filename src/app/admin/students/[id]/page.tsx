'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import Modal from '@/components/Modal'
import { useNotification } from '@/components/NotificationProvider'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import 'chartjs-adapter-date-fns'

interface Student {
  id: string
  studentCode: string
  firstName: string
  lastName: string
  name: string
  email: string
  grade?: string
  status: string
  enrollmentDate: string
  monthlyDueAmount?: number
  discountRate?: number
  membershipPlan?: {
    id: string
    name: string
    daysPerWeek: number
    monthlyPrice: number
  }
  parentName?: string
  parentEmail?: string
  paymentStatus: {
    current: boolean
    lastPayment?: string
    nextDue?: string
  }
  academicStatus: {
    currentGrade?: string
    averageScore?: number
    testsCompleted: number
  }
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
}

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  checkInTime?: string
  checkOutTime?: string
  notes?: string
}

interface StudentSchedule {
  dayOfWeek: string
  startTime: string
  endTime: string
}

interface Note {
  id: string
  content: string
  status: 'WARNING' | 'INFO' | 'POSITIVE'
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
  }
  students: {
    id: string
    firstName: string
    lastName: string
    studentCode: string
  }[]
}

export default function StudentInfoPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const { showNotification } = useNotification()
  const studentId = params.id as string

  // Register Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  )

  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [schedule, setSchedule] = useState<StudentSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [attendanceForm, setAttendanceForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED',
    notes: ''
  })

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    grade: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    monthlyDueAmount: '',
    discountRate: ''
  })

  // Notes state
  const [notes, setNotes] = useState<Note[]>([])
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [showEditNoteModal, setShowEditNoteModal] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteForm, setNoteForm] = useState({
    content: '',
    status: 'INFO' as 'WARNING' | 'INFO' | 'POSITIVE',
    studentIds: [] as string[]
  })
  const [allStudents, setAllStudents] = useState<Array<{
    id: string
    firstName: string
    lastName: string
    studentCode: string
  }>>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Test scores state
  const [testScores, setTestScores] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'1' | '3' | '6'>('3')
  const [activeTestTab, setActiveTestTab] = useState<'closed' | 'done' | 'upcoming'>('closed')
  
  const fetchStudentData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setStudent(data.student)
        
        // Extract test scores for the graph
        if (data.student.testCategories) {
          const processedTests = data.student.testCategories.closed
            .filter((test: any) => test.score !== null)
            .map((test: any) => ({
              id: test.id,
              score: (test.score / test.maxScore) * 100, // Convert to percentage
              rawScore: test.score, // Keep raw score for tooltip
              maxScore: test.maxScore, // Keep max score for tooltip
              date: test.scheduledDate,
              subject: test.subject
            }))
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
          
          setTestScores(processedTests)
        }
      }
    } catch (error) {
      console.error('Failed to fetch student:', error)
      showNotification('Failed to load student data', 'error')
    }
  }, [studentId, showNotification])

  const fetchAttendanceData = useCallback(async () => {
    try {
      const startDate = format(startOfWeek(new Date()), 'yyyy-MM-dd')
      const endDate = format(endOfWeek(new Date()), 'yyyy-MM-dd')

      const response = await fetch(
        `/api/admin/attendance?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setAttendance(data.attendance)
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
      showNotification('Failed to load attendance data', 'error')
    } finally {
      setLoading(false)
    }
  }, [studentId, showNotification])

  const fetchStudentSchedule = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}/schedule`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data.schedule)
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    }
  }, [studentId])

  const fetchNotesData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/students/${studentId}/notes`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error)
      showNotification('Failed to load notes data', 'error')
    }
  }, [studentId, showNotification])

  const fetchAllStudents = useCallback(async () => {
    if (allStudents.length > 0) return // Already loaded

    setLoadingStudents(true)
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setAllStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoadingStudents(false)
    }
  }, [allStudents.length])

  useEffect(() => {
    if (session && studentId) {
      fetchStudentData()
      fetchAttendanceData()
      fetchStudentSchedule()
      fetchNotesData()
    }
  }, [session, studentId, fetchStudentData, fetchAttendanceData, fetchStudentSchedule, fetchNotesData])

  const handleAttendanceSubmit = async () => {
    if (!selectedDate) {
      showNotification('Please select a date', 'warning')
      return
    }

    try {
      const response = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          date: selectedDate,
          checkInTime: attendanceForm.checkInTime || null,
          checkOutTime: attendanceForm.checkOutTime || null,
          status: attendanceForm.status,
          notes: attendanceForm.notes
        })
      })

      if (response.ok) {
        showNotification('Attendance recorded successfully', 'success')
        setShowAttendanceModal(false)
        setAttendanceForm({
          checkInTime: '',
          checkOutTime: '',
          status: 'PRESENT',
          notes: ''
        })
        fetchAttendanceData()
      } else {
        showNotification('Failed to record attendance', 'error')
      }
    } catch (error) {
      console.error('Failed to submit attendance:', error)
      showNotification('Failed to record attendance', 'error')
    }
  }

  const getAttendanceForDate = (date: Date) => {
    return attendance.find(record => isSameDay(parseISO(record.date), date))
  }

  const getScheduledDays = () => {
    return schedule.map(s => s.dayOfWeek)
  }

  const isScheduledDay = (date: Date) => {
    const dayName = format(date, 'EEEE').toUpperCase()
    return getScheduledDays().includes(dayName)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('Note deleted successfully', 'success')
        fetchNotesData()
      } else {
        showNotification('Failed to delete note', 'error')
      }
    } catch (error) {
      console.error('Failed to delete note:', error)
      showNotification('Failed to delete note', 'error')
    }
  }

  const handleRemoveStudentFromNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to remove this student from the note?')) {
      return
    }

    try {
      const response = await fetch(`/api/notes/${noteId}/students/${studentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showNotification('Student removed from note successfully', 'success')
        fetchNotesData()
      } else {
        showNotification('Failed to remove student from note', 'error')
      }
    } catch (error) {
      console.error('Failed to remove student from note:', error)
      showNotification('Failed to remove student from note', 'error')
    }
  }

  const handleAddNote = async () => {
    if (!noteForm.content.trim()) {
      showNotification('Note content is required', 'warning')
      return
    }

    if (noteForm.studentIds.length === 0) {
      showNotification('At least one student must be selected', 'warning')
      return
    }

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteForm.content,
          status: noteForm.status,
          studentIds: noteForm.studentIds
        })
      })

      if (response.ok) {
        showNotification('Note added successfully', 'success')
        setShowAddNoteModal(false)
        setNoteForm({ content: '', status: 'INFO', studentIds: [] })
        fetchNotesData()
      } else {
        showNotification('Failed to add note', 'error')
      }
    } catch (error) {
      console.error('Failed to add note:', error)
      showNotification('Failed to add note', 'error')
    }
  }

  const handleEditNote = async () => {
    if (!selectedNote || !noteForm.content.trim()) {
      showNotification('Note content is required', 'warning')
      return
    }

    if (noteForm.studentIds.length === 0) {
      showNotification('At least one student must be selected', 'warning')
      return
    }

    try {
      const response = await fetch(`/api/notes/${selectedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: noteForm.content,
          status: noteForm.status,
          studentIds: noteForm.studentIds
        })
      })

      if (response.ok) {
        showNotification('Note updated successfully', 'success')
        setShowEditNoteModal(false)
        setSelectedNote(null)
        setNoteForm({ content: '', status: 'INFO', studentIds: [] })
        fetchNotesData()
      } else {
        showNotification('Failed to update note', 'error')
      }
    } catch (error) {
      console.error('Failed to update note:', error)
      showNotification('Failed to update note', 'error')
    }
  }

  const generateWeeklyAttendance = () => {
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

    // Filter to only include scheduled days
    return days
      .filter(date => isScheduledDay(date))
      .map(date => {
        const record = getAttendanceForDate(date)
        const isScheduled = isScheduledDay(date)

        return {
          date,
          isScheduled,
          record: record || null
        }
      })
  }

  const handleEditStudent = () => {
    if (!student) return

    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      grade: student.grade || '',
      status: student.status as 'ACTIVE' | 'INACTIVE',
      monthlyDueAmount: student.monthlyDueAmount?.toString() || '',
      discountRate: student.discountRate?.toString() || ''
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async () => {
    if (!student) return

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          grade: editForm.grade || null,
          isActive: editForm.status === 'ACTIVE',
          monthlyDueAmount: editForm.monthlyDueAmount ? parseFloat(editForm.monthlyDueAmount) : null,
          discountRate: editForm.discountRate ? parseFloat(editForm.discountRate) : null
        })
      })

      if (response.ok) {
        showNotification('Student updated successfully', 'success')
        setShowEditModal(false)
        // Refresh student data
        fetchStudentData()
      } else {
        showNotification('Failed to update student', 'error')
      }
    } catch (error) {
      console.error('Failed to update student:', error)
      showNotification('Failed to update student', 'error')
    }
  }

  const getFilteredTestScores = () => {
    const now = new Date()
    const monthsBack = parseInt(timeRange)
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate())
    
    return testScores.filter(test => new Date(test.date) >= cutoffDate)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading student information...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">Student not found</div>
      </div>
    )
  }

  const weeklyAttendance = generateWeeklyAttendance()

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{student.firstName} {student.lastName}</h2>
            <p className="text-gray-600 mt-2">View and manage student details and attendance</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/admin/students">
              <Button variant="outline">Back to Students</Button>
            </Link>
            {session?.user.role === 'ADMIN' && (
              <>
                <Button onClick={handleEditStudent}>
                  Edit Student
                </Button>
                <Button onClick={() => setShowAttendanceModal(true)}>
                  Log Attendance
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Info Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Code</label>
                  <p className="mt-1 text-sm text-gray-900">{student.studentCode}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <Badge variant={student.status === 'ACTIVE' ? 'success' : 'default'}>
                    {student.status}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="mt-1 text-sm text-gray-900">{student.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900">{student.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{student.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <p className="mt-1 text-sm text-gray-900">{student.grade}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(student.enrollmentDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Average Score</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {student.academicStatus.averageScore
                      ? `${student.academicStatus.averageScore.toFixed(1)}%`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {student.parentName && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Parent</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {student.parentName} ({student.parentEmail})
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Presence Log Section */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Presence Log</CardTitle>
              <p className="text-sm text-gray-600">Current week scheduled attendance record</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyAttendance.map(({ date, isScheduled, record }) => (
                      <tr key={date.toISOString()}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(date, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(date, 'EEEE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record?.checkInTime ? format(parseISO(record.checkInTime), 'HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record?.checkOutTime ? format(parseISO(record.checkOutTime), 'HH:mm') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isScheduled ? (
                            record ? (
                              <Badge
                                variant={
                                  record.status === 'PRESENT' ? 'success' :
                                  record.status === 'LATE' ? 'warning' :
                                  record.status === 'EXCUSED' ? 'info' : 'error'
                                }
                              >
                                {record.status}
                              </Badge>
                            ) : (
                              <Badge variant="error">ABSENT</Badge>
                            )
                          ) : (
                            <span className="text-gray-400 text-sm">Not Scheduled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Test Score Evolution Graph */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Test Score Evolution</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={timeRange === '1' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('1')}
                  >
                    1 Month
                  </Button>
                  <Button
                    variant={timeRange === '3' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('3')}
                  >
                    3 Months
                  </Button>
                  <Button
                    variant={timeRange === '6' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange('6')}
                  >
                    6 Months
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getFilteredTestScores().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No test scores available for this student in the selected time range.</p>
                </div>
              ) : (
                <div className="h-80">
                  <Bar
                    data={{
                      datasets: [{
                        label: 'Test Scores',
                        data: getFilteredTestScores().map(test => ({
                          x: new Date(test.date).getTime(),
                          y: test.score,
                          subject: test.subject,
                          rawScore: test.rawScore,
                          maxScore: test.maxScore
                        })),
                        backgroundColor: getFilteredTestScores().map(test => {
                          // Color by subject
                          const colors: { [key: string]: string } = {
                            'Mathematics': '#3B82F6',
                            'Portuguese': '#10B981',
                            'English': '#F59E0B',
                            'Science': '#EF4444',
                            'History': '#8B5CF6',
                            'Geography': '#06B6D4',
                            'Arts': '#EC4899',
                            'Physical Education': '#84CC16'
                          }
                          return colors[test.subject] || '#6B7280'
                        }),
                        borderColor: getFilteredTestScores().map(test => {
                          const colors: { [key: string]: string } = {
                            'Mathematics': '#2563EB',
                            'Portuguese': '#059669',
                            'English': '#D97706',
                            'Science': '#DC2626',
                            'History': '#7C3AED',
                            'Geography': '#0891B2',
                            'Arts': '#DB2777',
                            'Physical Education': '#65A30D'
                          }
                          return colors[test.subject] || '#4B5563'
                        }),
                        borderWidth: 1,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        title: {
                          display: true,
                          text: `Test Scores - Last ${timeRange} Month${timeRange === '1' ? '' : 's'}`
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const dataPoint = context.raw as any
                              return `${dataPoint.subject}: ${dataPoint.rawScore}/${dataPoint.maxScore} (${context.parsed.y.toFixed(1)}%)`
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          type: 'time',
                          time: {
                            unit: 'day',
                            displayFormats: {
                              day: 'MMM dd'
                            }
                          },
                          title: {
                            display: true,
                            text: 'Date'
                          }
                        },
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Score (%)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Categories Section */}
          <Card>
            <CardHeader>
              <CardTitle>Test Management</CardTitle>
              <p className="text-sm text-gray-600">Detailed view of student&apos;s test status and history</p>
            </CardHeader>
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
                  Closed ({student.testCategories.closed.length})
                </button>
                <button
                  onClick={() => setActiveTestTab('done')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTestTab === 'done'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Done ({student.testCategories.done.length})
                </button>
                <button
                  onClick={() => setActiveTestTab('upcoming')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTestTab === 'upcoming'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Upcoming ({student.testCategories.upcoming.length})
                </button>
              </nav>
            </div>
            <CardContent>
              {activeTestTab === 'closed' && (
                <div>
                  {student.testCategories.closed.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📊</div>
                      <p className="text-gray-600">No graded tests yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {student.testCategories.closed.map((test) => {
                        const percentage = Math.round((test.score / test.maxScore) * 100)
                        return (
                          <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{test.title}</h4>
                              <p className="text-sm text-gray-600">{test.subject}</p>
                              <p className="text-sm text-gray-500">
                                Submitted: {new Date(test.scheduledDate).toLocaleDateString()}
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
                  {student.testCategories.done.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">✅</div>
                      <p className="text-gray-600">No completed tests awaiting grading</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {student.testCategories.done.map((test) => (
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
                  {student.testCategories.upcoming.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-2">📅</div>
                      <p className="text-gray-600">No upcoming tests scheduled</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {student.testCategories.upcoming.map((test) => (
                        <div key={test.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{test.title}</h4>
                            <p className="text-sm text-gray-600">{test.subject}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(test.scheduledDate).toLocaleDateString()} {' '}
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
            </CardContent>
          </Card>
        </div>

        {/* Membership Plan Section */}
        <div className="space-y-6">
          {student.membershipPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Membership Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{student.membershipPlan.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Days per Week</label>
                    <p className="mt-1 text-sm text-gray-900">{student.membershipPlan.daysPerWeek} days</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Price</label>
                    <p className="mt-1 text-sm text-gray-900">€{student.membershipPlan.monthlyPrice.toFixed(2)}/month</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Student Pays</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {student.monthlyDueAmount ? (
                        <>
                          €{student.monthlyDueAmount.toFixed(2)}/month
                          {(student.discountRate && student.discountRate > 0) && (
                            <span className="text-orange-600 ml-2">
                              ({student.discountRate}% discount applied)
                            </span>
                          )}
                        </>
                      ) : (
                        'Not set'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Student Notes</CardTitle>
                  <p className="text-sm text-gray-600">Manage notes and observations for this student</p>
                </div>
                {session?.user.role === 'ADMIN' && (
                  <Button onClick={() => {
                    fetchAllStudents()
                    setNoteForm({ content: '', status: 'INFO', studentIds: [studentId] })
                    setShowAddNoteModal(true)
                  }}>
                    Add Note
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No notes found for this student.</p>
                  {session?.user.role === 'ADMIN' && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        fetchAllStudents()
                        setNoteForm({ content: '', status: 'INFO', studentIds: [studentId] })
                        setShowAddNoteModal(true)
                      }}
                    >
                      Add First Note
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              note.status === 'WARNING' ? 'error' :
                              note.status === 'POSITIVE' ? 'success' : 'info'
                            }
                          >
                            {note.status === 'WARNING' ? 'Warning' :
                             note.status === 'POSITIVE' ? 'Positive' : 'Info'}
                          </Badge>
                          {note.updatedAt !== note.createdAt && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                              </svg>
                              Edited
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                          {session?.user.role === 'ADMIN' && (
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  fetchAllStudents()
                                  setSelectedNote(note)
                                  setNoteForm({
                                    content: note.content,
                                    status: note.status,
                                    studentIds: note.students.map(s => s.id)
                                  })
                                  setShowEditNoteModal(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteNote(note.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-900 mb-3">{note.content}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div>
                          <span>Created by: {note.createdBy.name}</span>
                          {note.updatedAt !== note.createdAt && (
                            <span className="ml-2">• Last edited by: {note.createdBy.name}</span>
                          )}
                        </div>
                        {note.students.length > 1 && (
                          <div className="flex items-center">
                            <span className="mr-2">Shared with {note.students.length - 1} other student(s)</span>
                            {session?.user.role === 'ADMIN' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveStudentFromNote(note.id)}
                              >
                                Remove from Note
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Section */}
          {schedule.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {schedule.map((slot, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{slot.dayOfWeek}</span>
                      <span className="text-sm text-gray-600">
                        {slot.startTime} - {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <Modal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          title="Log Attendance"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
              <input
                type="time"
                value={attendanceForm.checkInTime}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
              <input
                type="time"
                value={attendanceForm.checkOutTime}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={attendanceForm.status}
                onChange={(e) => setAttendanceForm(prev => ({
                  ...prev,
                  status: e.target.value as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAttendanceModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAttendanceSubmit}>
                Save Attendance
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <Modal
          isOpen={showAddNoteModal}
          onClose={() => setShowAddNoteModal(false)}
          title="Add New Note"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Note Content</label>
              <textarea
                value={noteForm.content}
                onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter note content..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={noteForm.status === 'INFO' ? 'primary' : 'outline'}
                  onClick={() => setNoteForm(prev => ({ ...prev, status: 'INFO' }))}
                  className="flex-1"
                >
                  Info
                </Button>
                <Button
                  type="button"
                  variant={noteForm.status === 'WARNING' ? 'primary' : 'outline'}
                  onClick={() => setNoteForm(prev => ({ ...prev, status: 'WARNING' }))}
                  className="flex-1"
                >
                  Warning
                </Button>
                <Button
                  type="button"
                  variant={noteForm.status === 'POSITIVE' ? 'primary' : 'outline'}
                  onClick={() => setNoteForm(prev => ({ ...prev, status: 'POSITIVE' }))}
                  className="flex-1"
                >
                  Positive
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Students</label>
              {loadingStudents ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading students...</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                  {allStudents.map((student) => (
                    <label key={student.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={noteForm.studentIds.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNoteForm(prev => ({
                              ...prev,
                              studentIds: [...prev.studentIds, student.id]
                            }))
                          } else {
                            setNoteForm(prev => ({
                              ...prev,
                              studentIds: prev.studentIds.filter(id => id !== student.id)
                            }))
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({student.studentCode})
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {noteForm.studentIds.length > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  {noteForm.studentIds.length} student{noteForm.studentIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddNoteModal(false)
                  setNoteForm({ content: '', status: 'INFO', studentIds: [] })
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddNote}
                disabled={noteForm.studentIds.length === 0}
              >
                Add Note
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Note Modal */}
      {showEditNoteModal && selectedNote && (
        <Modal
          isOpen={showEditNoteModal}
          onClose={() => setShowEditNoteModal(false)}
          title="Edit Note"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Note Content</label>
              <textarea
                value={noteForm.content}
                onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter note content..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={noteForm.status}
                onChange={(e) => setNoteForm(prev => ({
                  ...prev,
                  status: e.target.value as 'WARNING' | 'INFO' | 'POSITIVE'
                }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="POSITIVE">Positive</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditNoteModal(false)
                  setSelectedNote(null)
                  setNoteForm({ content: '', status: 'INFO', studentIds: [] })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditNote}>
                Update Note
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Student"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <input
                  type="text"
                  value={editForm.grade}
                  onChange={(e) => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    status: e.target.value as 'ACTIVE' | 'INACTIVE'
                  }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Monthly Due Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.monthlyDueAmount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, monthlyDueAmount: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Discount Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editForm.discountRate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, discountRate: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSubmit}>
                Update Student
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
