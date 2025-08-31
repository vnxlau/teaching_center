'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import OwlIcon from '@/components/icons/OwlIcon'

interface HealthData {
  totalUsers: number
  totalStudents: number
  activeSchoolYear: string
  message: string
}

interface Student {
  id: string
  studentCode: string
  firstName: string
  lastName: string
  grade: string
  isActive: boolean
  schoolYear: {
    name: string
    isActive: boolean
  }
  user: {
    email: string
    name: string
  }
  parents: Array<{
    parent: {
      firstName: string
      lastName: string
      phone: string
    }
  }>
  teachingPlan: {
    subjects: string[]
    goals: string
  } | null
  _count: {
    payments: number
    attendances: number
    tests: number
  }
}

export default function DatabaseDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState('Teaching Center')

  // Fetch school name from system settings
  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const response = await fetch('/api/admin/settings/system')
        if (response.ok) {
          const settings = await response.json()
          setSchoolName(settings.schoolName || 'Teaching Center')
        }
      } catch (error) {
        console.error('Failed to fetch school name:', error)
      }
    }
    fetchSchoolName()
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [healthResponse, studentsResponse] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/students')
        ])

        if (!healthResponse.ok || !studentsResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const healthResult = await healthResponse.json()
        const studentsResult = await studentsResponse.json()

        if (healthResult.success) {
          setHealthData(healthResult.data)
        }

        if (studentsResult.success) {
          setStudents(studentsResult.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading database information...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600">{error}</p>
          <Link href="/" className="mt-4 inline-block bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <OwlIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg font-semibold">{schoolName}</span>
              </Link>
              <span className="text-gray-400">•</span>
              <h1 className="text-xl font-semibold text-gray-900">Database Dashboard</h1>
            </div>
            <Link 
              href="/" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Health Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Connection Status</h2>
          {healthData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-600 text-sm font-medium">Status</div>
                <div className="text-2xl font-bold text-green-900">✅ Connected</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-600 text-sm font-medium">Total Users</div>
                <div className="text-2xl font-bold text-blue-900">{healthData.totalUsers}</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-purple-600 text-sm font-medium">Students</div>
                <div className="text-2xl font-bold text-purple-900">{healthData.totalStudents}</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-orange-600 text-sm font-medium">School Year</div>
                <div className="text-lg font-bold text-orange-900">{healthData.activeSchoolYear}</div>
              </div>
            </div>
          )}
        </div>

        {/* Students Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Students Overview</h2>
            <p className="text-gray-600">Sample data from the database</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{student.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.teachingPlan?.subjects.join(', ') || 'Not assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.parents.map((p, idx) => (
                        <div key={idx}>{p.parent.firstName} {p.parent.lastName}</div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Demo Accounts */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🔑 Demo Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-800">Admin Account</div>
              <div className="text-blue-700">admin@teachingcenter.com</div>
              <div className="text-blue-600">Password: demo123</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Teacher Account</div>
              <div className="text-blue-700">teacher@teachingcenter.com</div>
              <div className="text-blue-600">Password: demo123</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Parent Account</div>
              <div className="text-blue-700">parent1@example.com</div>
              <div className="text-blue-600">Password: demo123</div>
            </div>
            <div>
              <div className="font-medium text-blue-800">Student Account</div>
              <div className="text-blue-700">student1@example.com</div>
              <div className="text-blue-600">Password: demo123</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
