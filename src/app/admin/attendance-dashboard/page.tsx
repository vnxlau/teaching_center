'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useNotification } from '@/components/NotificationProvider'
import LoadingSpinner from '@/components/LoadingSpinner'
import Breadcrumb from '@/components/Breadcrumb'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
)

interface AttendanceStats {
  overview: {
    totalStudents: number
    activeStudents: number
    averageAttendanceRate: number
    totalAttendanceRecords: number
  }
  studentAssiduity: Array<{
    studentId: string
    studentName: string
    studentCode: string
    attendanceRate: number
    totalDays: number
    presentDays: number
    absentDays: number
    lateDays: number
    excusedDays: number
  }>
  weekdayStats: {
    monday: { expected: number, actual: number, rate: number }
    tuesday: { expected: number, actual: number, rate: number }
    wednesday: { expected: number, actual: number, rate: number }
    thursday: { expected: number, actual: number, rate: number }
    friday: { expected: number, actual: number, rate: number }
    saturday: { expected: number, actual: number, rate: number }
    sunday: { expected: number, actual: number, rate: number }
  }
  monthlyStats: Array<{
    month: string
    year: number
    totalDays: number
    presentDays: number
    attendanceRate: number
    maxAttendance: number
    minAttendance: number
  }>
  schoolYearStats: Array<{
    schoolYear: string
    totalDays: number
    presentDays: number
    attendanceRate: number
    maxAttendance: number
    minAttendance: number
  }>
  dailyAttendance: Array<{
    date: string
    expectedAttendance: number
    actualAttendance: number
    attendanceRate: number
    weekday: string
  }>
}

export default function AttendanceDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showNotification } = useNotification()
  const { t } = useLanguage()
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current-month')
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('')

  useEffect(() => {
    if (session && status === 'authenticated') {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        router.push('/auth/signin')
        return
      }
      fetchAttendanceStats()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [session, status, selectedPeriod, selectedSchoolYear])

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period: selectedPeriod,
        schoolYear: selectedSchoolYear
      })

      const response = await fetch(`/api/admin/attendance-dashboard?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        showNotification('Failed to load attendance statistics', 'error')
      }
    } catch (error) {
      console.error('Failed to fetch attendance stats:', error)
      showNotification('Failed to load attendance statistics', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return null
  }

  const breadcrumbItems = [
    { label: t.admin, href: '/admin/dashboard' },
    { label: t.attendanceDashboard, href: '/admin/attendance-dashboard' }
  ]

  return (
    <div className="space-y-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t.attendanceDashboard}</h2>
            <p className="text-gray-600 mt-2">{t.monitorAttendance}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.timePeriod}</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="current-month">{t.currentMonth}</option>
              <option value="last-month">{t.lastMonth}</option>
              <option value="last-3-months">{t.last3Months}</option>
              <option value="current-year">{t.currentYear}</option>
              <option value="last-year">{t.lastYear}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.schoolYear}</label>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{t.allSchoolYears}</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
            </select>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.avgAttendanceRate}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.averageAttendanceRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.activeStudents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.totalRecords}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overview.totalAttendanceRecords}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Assiduity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.studentAssiduity}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.student}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.attendanceRate}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.present}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.absent}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.late}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.excused}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.studentAssiduity.slice(0, 10).map((student) => (
                    <tr key={student.studentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{student.studentName}</div>
                          <div className="text-gray-500">{student.studentCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${student.attendanceRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{student.attendanceRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.presentDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{student.absentDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">{student.lateDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{student.excusedDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekday Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.weekdayAttendancePatterns}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.weekdayStats).map(([day, data]) => (
                <div key={day} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 capitalize mb-2">{day}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.expected}</span>
                      <span className="font-medium">{data.expected}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.actual}</span>
                      <span className="font-medium">{data.actual}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.rate}</span>
                      <span className={`font-medium ${data.rate >= 80 ? 'text-green-600' : data.rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {data.rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Attendance Graph */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.dailyAttendanceOverview}</h3>
            <div className="h-80">
              <Bar
                data={{
                  labels: stats.dailyAttendance.slice(-14).map(day =>
                    new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  ),
                  datasets: [
                    {
                      label: t.expectedAttendance,
                      data: stats.dailyAttendance.slice(-14).map(day => day.expectedAttendance),
                      backgroundColor: 'rgba(59, 130, 246, 0.5)',
                      borderColor: 'rgba(59, 130, 246, 1)',
                      borderWidth: 1,
                    },
                    {
                      label: t.actualAttendance,
                      data: stats.dailyAttendance.slice(-14).map(day => day.actualAttendance),
                      backgroundColor: day => {
                        const expected = stats.dailyAttendance.slice(-14)[day.dataIndex]?.expectedAttendance || 0
                        const actual = day.raw as number
                        return actual >= expected
                          ? 'rgba(34, 197, 94, 0.5)' // Green for meeting/exceeding expectations
                          : 'rgba(239, 68, 68, 0.5)' // Red for below expectations
                      },
                      borderColor: day => {
                        const expected = stats.dailyAttendance.slice(-14)[day.dataIndex]?.expectedAttendance || 0
                        const actual = day.raw as number
                        return actual >= expected
                          ? 'rgba(34, 197, 94, 1)'
                          : 'rgba(239, 68, 68, 1)'
                      },
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: true,
                      text: `${t.expectedVsActual} (${t.last14Days})`,
                    },
                    tooltip: {
                      callbacks: {
                        afterLabel: (context) => {
                          const dayIndex = context.dataIndex
                          const day = stats.dailyAttendance.slice(-14)[dayIndex]
                          const weekday = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })
                          return `Day: ${weekday}`
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: t.numberOfStudents
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: t.date
                      }
                    }
                  },
                }}
              />
            </div>
            <div className="flex justify-center mt-4 space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">{t.expected}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">{t.actual} (≥ {t.expected})</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">{t.actual} (&lt; {t.expected})</span>
              </div>
            </div>
          </div>

          {/* Monthly Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.monthlyStatistics}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.date}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.totalDays}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.presentDays}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.attendanceRate}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.maxAttendance}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.minAttendance}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.monthlyStats.map((month, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{month.month} {month.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.totalDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.presentDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          month.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                          month.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {month.attendanceRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.maxAttendance}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{month.minAttendance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* School Year Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.schoolYearStatistics}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.schoolYear}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.totalDays}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.presentDays}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.attendanceRate}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.maxAttendance}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.minAttendance}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.schoolYearStats.map((year, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{year.schoolYear}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.totalDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.presentDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          year.attendanceRate >= 80 ? 'bg-green-100 text-green-800' :
                          year.attendanceRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {year.attendanceRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.maxAttendance}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{year.minAttendance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
