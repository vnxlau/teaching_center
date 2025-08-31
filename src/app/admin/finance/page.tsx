'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/Modal'
import AutoPaymentGenerator from '@/components/admin/AutoPaymentGenerator'

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
  monthly: {
    totalDue: number
    totalDueAmount: number
    paid: number
    paidAmount: number
    pending: number
    pendingAmount: number
    overdue: number
    overdueAmount: number
  }
  schoolYear: {
    name: string
    totalDue: number
    totalDueAmount: number
    paid: number
    paidAmount: number
    pending: number
    pendingAmount: number
    overdue: number
    overdueAmount: number
  }
}

export default function FinanceManagement() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [students, setStudents] = useState<{ id: string, name: string, studentCode: string }[]>([])
  const [currentSchoolYearId, setCurrentSchoolYearId] = useState<string | null>(null)
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    amount: '',
    description: '',
    dueDate: '',
    status: 'PENDING' as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  })

  // Set default month filter to current month (August 2025)
  useEffect(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setMonthFilter(currentMonth)
  }, [])

  useEffect(() => {
    if (session) {
      fetchCurrentSchoolYear()
      if (monthFilter) {
        fetchFinancialData()
      }
    }
  }, [session, monthFilter, filterType])

  const fetchFinancialData = async () => {
    try {
      const params = new URLSearchParams()
      if (monthFilter) params.append('month', monthFilter)
      if (filterType !== 'all') params.append('filter', filterType)
      
      const response = await fetch(`/api/admin/finance?${params}`)
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
  }

  const handleMonthFilterClick = (type: string) => {
    setFilterType(type)
  }

  const getMonthName = (monthString: string) => {
    if (!monthString) return ''
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

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

  const fetchCurrentSchoolYear = async () => {
    try {
      const response = await fetch('/api/admin/school-years')
      if (response.ok) {
        const data = await response.json()
        if (data.activeSchoolYear) {
          setCurrentSchoolYearId(data.activeSchoolYear.id)
        } else {
          console.error('No active school year found')
          setCurrentSchoolYearId(null)
        }
      } else {
        console.error('Failed to fetch school years')
        setCurrentSchoolYearId(null)
      }
    } catch (error) {
      console.error('Failed to fetch school year:', error)
      setCurrentSchoolYearId(null)
    }
  }

  const createPayment = async () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.description || !newPayment.dueDate) {
      alert('Please fill in all fields')
      return
    }

    if (!currentSchoolYearId) {
      alert('School year not available. Please try again.')
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
          notes: newPayment.description, // Fixed: description -> notes
          dueDate: newPayment.dueDate,
          status: newPayment.status,
          schoolYearId: currentSchoolYearId, // Added required field
          paymentType: 'MONTHLY_FEE' // Default payment type
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
        alert('Payment record created successfully!')
      } else {
        const errorData = await response.json()
        console.error('Payment creation error:', errorData)
        alert(`Failed to create payment record: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create payment:', error)
      alert('Failed to create payment record')
    }
  }

  const openPaymentModal = () => {
    fetchStudents()
    fetchCurrentSchoolYear()
    setShowPaymentModal(true)
  }

  const viewPayment = (payment: Payment) => {
    alert(`Payment Details:\n\nStudent: ${payment.studentName} (${payment.studentCode})\nAmount: €${payment.amount}\nDescription: ${payment.description}\nDue Date: ${payment.dueDate}\nStatus: ${payment.status}\nPayment Date: ${payment.paymentDate || 'Not paid yet'}\nMethod: ${payment.method || 'Not specified'}`)
  }

  const editPayment = (payment: Payment) => {
    // For now, just show an alert. You can implement a proper edit modal later
    alert(`Edit Payment ${payment.id}\n\nThis feature will open an edit form for:\n${payment.studentName} - €${payment.amount}`)
  }

  const markAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/finance/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAID',
          paymentDate: new Date().toISOString(),
          method: 'Cash' // Default method, you can make this configurable
        })
      })

      if (response.ok) {
        fetchFinancialData() // Refresh the data
        alert('Payment marked as paid successfully!')
      } else {
        alert('Failed to mark payment as paid')
      }
    } catch (error) {
      console.error('Failed to mark payment as paid:', error)
      alert('Failed to mark payment as paid')
    }
  }

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/' })
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

  if (!session) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading session...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Financial Overview</h2>
              <p className="text-gray-600 mt-2">Monitor payments, revenue, and billing status</p>
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

        {/* Monthly Overview Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{getMonthName(monthFilter)} Data</h3>
              <p className="text-sm text-gray-600">Current month payment overview and analytics</p>
              <p className="text-gray-600 text-sm">
                Click on any metric to filter payments by category
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Month:</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {stats?.monthly && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Due Payments */}
              <div 
                className={`bg-blue-50 rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                  filterType === 'all' ? 'border-blue-500' : 'border-transparent hover:border-blue-300'
                }`}
                onClick={() => handleMonthFilterClick('all')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Due</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.monthly.totalDue}</p>
                    <p className="text-blue-700 text-sm">€{(Number(stats.monthly.totalDueAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Paid Payments */}
              <div 
                className={`bg-green-50 rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                  filterType === 'paid' ? 'border-green-500' : 'border-transparent hover:border-green-300'
                }`}
                onClick={() => handleMonthFilterClick('paid')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Paid</p>
                    <p className="text-2xl font-bold text-green-900">{stats.monthly.paid}</p>
                    <p className="text-green-700 text-sm">€{(Number(stats.monthly.paidAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Pending Payments */}
              <div 
                className={`bg-yellow-50 rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                  filterType === 'due' ? 'border-yellow-500' : 'border-transparent hover:border-yellow-300'
                }`}
                onClick={() => handleMonthFilterClick('due')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">{stats.monthly.pending}</p>
                    <p className="text-yellow-700 text-sm">€{(Number(stats.monthly.pendingAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Overdue Payments */}
              <div 
                className={`bg-red-50 rounded-lg p-4 cursor-pointer border-2 transition-colors ${
                  filterType === 'overdue' ? 'border-red-500' : 'border-transparent hover:border-red-300'
                }`}
                onClick={() => handleMonthFilterClick('overdue')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Overdue</p>
                    <p className="text-2xl font-bold text-red-900">{stats.monthly.overdue}</p>
                    <p className="text-red-700 text-sm">€{(Number(stats.monthly.overdueAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* School Year Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">School Year Overview</h3>
              <p className="text-sm text-gray-600">{stats?.schoolYear?.name || 'N/A'} Academic Year</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Full Academic Year</p>
              <p className="text-xs text-gray-500">September to July</p>
            </div>
          </div>

          {stats?.schoolYear && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* School Year Total Due */}
              <div className="bg-purple-50 rounded-lg p-4 border-2 border-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Total Due</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.schoolYear.totalDue}</p>
                    <p className="text-purple-700 text-sm">€{(Number(stats.schoolYear.totalDueAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* School Year Paid */}
              <div className="bg-emerald-50 rounded-lg p-4 border-2 border-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 text-sm font-medium">Paid</p>
                    <p className="text-2xl font-bold text-emerald-900">{stats.schoolYear.paid}</p>
                    <p className="text-emerald-700 text-sm">€{(Number(stats.schoolYear.paidAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* School Year Pending */}
              <div className="bg-amber-50 rounded-lg p-4 border-2 border-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-600 text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold text-amber-900">{stats.schoolYear.pending}</p>
                    <p className="text-amber-700 text-sm">€{(Number(stats.schoolYear.pendingAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* School Year Overdue */}
              <div className="bg-rose-50 rounded-lg p-4 border-2 border-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rose-600 text-sm font-medium">Overdue</p>
                    <p className="text-2xl font-bold text-rose-900">{stats.schoolYear.overdue}</p>
                    <p className="text-rose-700 text-sm">€{(Number(stats.schoolYear.overdueAmount) || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-rose-100 rounded-lg">
                    <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auto Payment Generator */}
        {currentSchoolYearId && (
          <AutoPaymentGenerator 
            schoolYearId={currentSchoolYearId}
            onPaymentsGenerated={(result) => {
              // Refresh financial data after payments are generated
              fetchFinancialData()
            }}
          />
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
                        <div className="text-sm font-medium text-gray-900">€{(Number(payment.amount) || 0).toLocaleString()}</div>
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
                          <button 
                            onClick={() => viewPayment(payment)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => editPayment(payment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          {payment.status === 'PENDING' && (
                            <button 
                              onClick={() => markAsPaid(payment.id)}
                              className="text-green-600 hover:text-green-900"
                            >
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
