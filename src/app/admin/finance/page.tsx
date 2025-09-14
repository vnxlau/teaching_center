'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import AutoPaymentGenerator from '@/components/admin/AutoPaymentGenerator'
import { useNotification } from '@/components/NotificationProvider'
import LoadingSpinner from '@/components/LoadingSpinner'
import Breadcrumb from '@/components/Breadcrumb'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyEuroIcon,
  DocumentArrowDownIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

interface FinancialMovement {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  date: string
  description: string
  category?: string
  studentName?: string
  studentCode?: string
  vendor?: string
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentMethod?: string
  createdAt?: string
}

interface FinancialStats {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNetBalance: number
  pendingIncome: number
  pendingExpenses: number
  totalTransactions: number
}

export default function FinanceDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showNotification } = useNotification()
  const { t } = useLanguage()
  const [movements, setMovements] = useState<FinancialMovement[]>([])
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
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
  const itemsPerPage = 20

  const fetchFinancialData = useCallback(async () => {
    try {
      const [paymentsResponse, expensesResponse] = await Promise.all([
        fetch('/api/admin/payments'),
        fetch('/api/admin/expenses')
      ])

      if (paymentsResponse.ok && expensesResponse.ok) {
        const payments = await paymentsResponse.json()
        const expenses = await expensesResponse.json()

        // Transform payments to movements
        const incomeMovements: FinancialMovement[] = payments.map((payment: any) => ({
          id: `payment-${payment.id}`,
          type: 'INCOME' as const,
          amount: payment.amount,
          date: payment.dueDate,
          description: payment.description || `Payment from ${payment.studentName || 'Student'}`,
          category: 'Student Payment',
          studentName: payment.studentName,
          studentCode: payment.studentCode,
          status: payment.status,
          paymentMethod: payment.method,
          createdAt: payment.paidDate
        }))

        // Transform expenses to movements
        const expenseMovements: FinancialMovement[] = expenses.map((expense: any) => ({
          id: `expense-${expense.id}`,
          type: 'EXPENSE' as const,
          amount: expense.amount,
          date: expense.date,
          description: expense.description,
          category: expense.category || expense.type,
          vendor: expense.vendor,
          createdAt: expense.createdAt
        }))

        // Combine and sort by date (newest first)
        const allMovements = [...incomeMovements, ...expenseMovements]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setMovements(allMovements)
      } else {
        showNotification('Failed to load financial data', 'error')
      }
    } catch (error) {
      console.error('Failed to fetch financial data:', error)
      showNotification('Failed to load financial data', 'error')
    }
  }, [showNotification])

  const fetchStats = useCallback(async () => {
    try {
      const [paymentsStatsResponse, expensesStatsResponse] = await Promise.all([
        fetch('/api/admin/payments/stats'),
        fetch('/api/admin/expenses/stats')
      ])

      if (paymentsStatsResponse.ok && expensesStatsResponse.ok) {
        const paymentsStats = await paymentsStatsResponse.json()
        const expensesStats = await expensesStatsResponse.json()

        const financialStats: FinancialStats = {
          totalIncome: paymentsStats.totalRevenue || 0,
          totalExpenses: expensesStats.overview?.totalExpenses || 0,
          netBalance: (paymentsStats.totalRevenue || 0) - (expensesStats.overview?.totalExpenses || 0),
          monthlyIncome: paymentsStats.monthlyRevenue || 0,
          monthlyExpenses: expensesStats.overview?.monthlyExpenses || 0,
          monthlyNetBalance: (paymentsStats.monthlyRevenue || 0) - (expensesStats.overview?.monthlyExpenses || 0),
          pendingIncome: paymentsStats.pendingAmount || 0,
          pendingExpenses: 0, // Expenses don't have pending status in current schema
          totalTransactions: movements.length
        }

        setStats(financialStats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }, [movements.length])

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
    fetchStats()
    fetchCurrentSchoolYear()
    fetchCurrentMonthStats()
  }, [session, status, router, fetchFinancialData, fetchStats])

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
    setFilterType(filterType)
    setSearchTerm('') // Clear search when using card filters
  }

  const getCurrentMonthName = () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Filter movements based on search and type
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || movement.type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesType
  })

  // Pagination
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

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
            <h2 className="text-3xl font-bold text-gray-900">Financial Dashboard</h2>
            <p className="text-gray-600 mt-2">Comprehensive view of all financial movements</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <DocumentArrowDownIcon className="h-5 w-5" />
              <span>Generate Report</span>
            </button>
            <Link href="/admin/business/payments">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <CreditCardIcon className="h-5 w-5" />
                <span>Payments</span>
              </button>
            </Link>
            <Link href="/admin/business/expenses">
              <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                <BanknotesIcon className="h-5 w-5" />
                <span>Expenses</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Overview Stats */}
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

        {/* Financial Overview Stats */}
        {stats && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                � Financial Overview
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Net Balance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Net Balance</p>
                      <p className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{stats.netBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <CurrencyEuroIcon className={`w-6 h-6 ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>

                {/* Monthly Net Balance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className={`text-2xl font-bold ${stats.monthlyNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{stats.monthlyNetBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.monthlyNetBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <BanknotesIcon className={`w-6 h-6 ${stats.monthlyNetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                </div>

                {/* Total Income */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        €{stats.totalIncome.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <ArrowUpIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        €{stats.totalExpenses.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <ArrowDownIcon className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
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
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Type
              </label>
              <select
                id="type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Movements</option>
                <option value="income">Income</option>
                <option value="expense">Expenses</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Movements Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading financial movements...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Movements Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No financial movement records available.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
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
                  {paginatedMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.type === 'INCOME' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {movement.type === 'INCOME' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{movement.description}</div>
                        {movement.studentName && (
                          <div className="text-xs text-gray-500">Student: {movement.studentName}</div>
                        )}
                        {movement.vendor && (
                          <div className="text-xs text-gray-500">Vendor: {movement.vendor}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          movement.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.type === 'INCOME' ? '+' : '-'}€{movement.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(movement.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{movement.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {movement.status && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(movement.status)}`}>
                            {movement.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button className="text-primary-600 hover:text-primary-900">
                            View
                          </button>
                          {movement.type === 'INCOME' && movement.status === 'PENDING' && (
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
