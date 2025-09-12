'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/Card'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'

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

export default function ParentStudentInfoPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Student | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [schedule, setSchedule] = useState<StudentSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && studentId) {
      fetchStudentData()
      fetchAttendanceData()
      fetchStudentSchedule()
    }
  }, [session, studentId])

  const fetchStudentData = async () => {
    try {
      const response = await fetch(`/api/parent/students/${studentId}`)
      if (response.ok) {
        const data = await response.json()
        setStudent(data.student)
      }
    } catch (error) {
      console.error('Failed to fetch student:', error)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      const startDate = format(startOfWeek(new Date()), 'yyyy-MM-dd')
      const endDate = format(endOfWeek(new Date()), 'yyyy-MM-dd')

      const response = await fetch(
        `/api/parent/students/${studentId}/attendance?startDate=${startDate}&endDate=${endDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setAttendance(data.attendance)
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentSchedule = async () => {
    try {
      const response = await fetch(`/api/parent/students/${studentId}/schedule`)
      if (response.ok) {
        const data = await response.json()
        setSchedule(data.schedule)
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
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
            <h2 className="text-3xl font-bold text-gray-900">Student Information</h2>
            <p className="text-gray-600 mt-2">View your child&apos;s information and attendance</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/parent/students">
              <Button variant="outline">Back to Students</Button>
            </Link>
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
            </CardContent>
          </Card>

          {/* Presence Log Section */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Attendance</CardTitle>
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
                    <label className="block text-sm font-medium text-gray-700">Monthly Amount</label>
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
    </div>
  )
}
