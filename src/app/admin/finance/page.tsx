'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import AutoPaymentGenerator from '@/components/admin/AutoPaymentGenerator'
import { useNotification } from '@/components/NotificationProvider'

interface Payment {
  id: string
  studentCode: string
  studentName: string
  amount: number
  dueDate: string
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentDate?: string
  description: string
  method?: string
}

interface FinancialStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingAmount: number
  overdueAmount: number
  totalStudents: number
  payingStudents: number
}

export default function FinanceManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [students, setStudents] = useState<{ id: string, name: string, studentCode: string }[]>([])
  const [currentSchoolYearId, setCurrentSchoolYearId] = useState<string | null>(null)
  const [currentMonthStats, setCurrentMonthStats] = useState<any>(null)
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    amount: '',
    description: '',
    dueDate: '',
    status: 'PENDING' as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  })
  const { showNotification } = useNotification()

  const fetchFinancialData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/finance')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCurrentSchoolYear = async () => {
    try {
      const response = await fetch('/api/admin/school-years/current')
      if (response.ok) {
        const data = await response.json()
        setCurrentSchoolYearId(data.schoolYear?.id || null)
      }
    } catch (error) {
      console.error('Failed to fetch current school year:', error)
    }
  }

  const fetchCurrentMonthStats = async () => {
    try {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      const response = await fetch(`/api/admin/finance/monthly-stats?month=${currentMonth}&year=${currentYear}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentMonthStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch current month stats:', error)
    }
  }

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

    fetchFinancialData()
    fetchCurrentSchoolYear()
    fetchCurrentMonthStats()
  }, [session, status, router, fetchFinancialData])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }

  const createPayment = async () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.description || !newPayment.dueDate) {
      showNotification('Please fill in all fields', 'warning')
      return
    }

    try {
      const response = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: newPayment.studentId,
          amount: parseFloat(newPayment.amount),
          description: newPayment.description,
          dueDate: newPayment.dueDate,
          status: newPayment.status
        })
      })

      if (response.ok) {
        setNewPayment({
          studentId: '',
          amount: '',
          description: '',
          dueDate: '',
          status: 'PENDING'
        })
        setShowPaymentModal(false)
        fetchFinancialData()
        showNotification('Payment record created successfully!', 'success')
      } else {
        showNotification('Failed to create payment record', 'error')
      }
    } catch (error) {
      console.error('Failed to create payment:', error)
      showNotification('Failed to create payment record', 'error')
    }
  }

  const openPaymentModal = () => {
    fetchStudents()
    setShowPaymentModal(true)
  }

  const handleCardFilter = (filterType: string) => {
    setFilterStatus(filterType)
    setSearchTerm('') // Clear search when using card filters
  }

  const getCurrentMonthName = () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' || payment.status.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Financial Management</h2>
            <p className="text-gray-600 mt-2">Track payments, billing, and revenue</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Generate Report
            </button>
            <button
              onClick={openPaymentModal}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Payment
            </button>
          </div>
        </div>
      </div>

      {/* Current Month Focus Section */}
        {currentMonthStats && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                📅 {currentMonthStats.monthName} Data
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Due Payments (Total) */}
                <div 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow hover:bg-blue-50"
                  onClick={() => handleCardFilter('all')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Due Payments</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {currentMonthStats.stats.totalPayments.count}
                        </span>
                        <span className="text-sm text-gray-500">payments</span>
                      </div>
                      <p className="text-lg font-semibold text-blue-700">
                        €{currentMonthStats.stats.totalPayments.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Paid Payments */}
                <div 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow hover:bg-green-50"
                  onClick={() => handleCardFilter('paid')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Paid</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-green-600">
                          {currentMonthStats.stats.paidPayments.count}
                        </span>
                        <span className="text-sm text-gray-500">payments</span>
                      </div>
                      <p className="text-lg font-semibold text-green-700">
                        €{currentMonthStats.stats.paidPayments.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Still Due Payments */}
                <div 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow hover:bg-yellow-50"
                  onClick={() => handleCardFilter('pending')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Still Due</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-yellow-600">
                          {currentMonthStats.stats.stillDuePayments.count}
                        </span>
                        <span className="text-sm text-gray-500">payments</span>
                      </div>
                      <p className="text-lg font-semibold text-yellow-700">
                        €{currentMonthStats.stats.stillDuePayments.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-blue-700">
                  💡 Click on any card above to filter the payment list below
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.monthlyRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.pendingAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">€{stats.overdueAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automatic Payment Generator */}
        {currentSchoolYearId && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                🔄 Automatic Payment Generation
              </h3>
              <AutoPaymentGenerator 
                schoolYearId={currentSchoolYearId}
                onPaymentsGenerated={() => {
                  fetchFinancialData()
                  fetchCurrentMonthStats()
                }}
              />
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Payments
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name, ID, or description..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No payment records available.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{payment.studentName}</div>
                          <div className="text-sm text-gray-500">ID: {payment.studentCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">€{payment.amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(payment.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button className="text-primary-600 hover:text-primary-900">
                            View
                          </button>
                          <button className="text-blue-600 hover:text-blue-900">
                            Edit
                          </button>
                          {payment.status === 'PENDING' && (
                            <button className="text-green-600 hover:text-green-900">
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Add New Payment Record"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
              Student
            </label>
            <select
              id="student"
              value={newPayment.studentId}
              onChange={(e) => setNewPayment({ ...newPayment, studentId: e.target.value })}
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
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (€)
            </label>
            <input
              type="number"
              id="amount"
              step="0.01"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={newPayment.description}
              onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Monthly tuition, materials, etc."
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={newPayment.dueDate}
              onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={newPayment.status}
              onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createPayment}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
