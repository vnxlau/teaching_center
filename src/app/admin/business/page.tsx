'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useNotification } from '@/components/NotificationProvider'
import { useLanguage } from '@/contexts/LanguageContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  CurrencyEuroIcon,
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
  vendor?: string
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentMethod?: string
}

interface BusinessStats {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  pendingIncome: number
  pendingExpenses: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyNetProfit: number
}

export default function BusinessDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showNotification } = useNotification()
  const { t } = useLanguage()
  const [movements, setMovements] = useState<FinancialMovement[]>([])
  const [stats, setStats] = useState<BusinessStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  const fetchMovements = useCallback(async () => {
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
          status: payment.status,
          paymentMethod: payment.method
        }))

        // Transform expenses to movements
        const expenseMovements: FinancialMovement[] = expenses.map((expense: any) => ({
          id: `expense-${expense.id}`,
          type: 'EXPENSE' as const,
          amount: expense.amount,
          date: expense.date,
          description: expense.description,
          category: expense.category || expense.type,
          vendor: expense.vendor
        }))

        // Combine and sort by date (newest first)
        const allMovements = [...incomeMovements, ...expenseMovements]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setMovements(allMovements)
      } else {
        showNotification('Failed to load financial data', 'error')
      }
    } catch (error) {
      console.error('Failed to fetch movements:', error)
      showNotification('Failed to load financial data', 'error')
    }
  }, [showNotification])

  const fetchStats = async () => {
    try {
      const [paymentsStatsResponse, expensesStatsResponse] = await Promise.all([
        fetch('/api/admin/payments/stats'),
        fetch('/api/admin/expenses/stats')
      ])

      if (paymentsStatsResponse.ok && expensesStatsResponse.ok) {
        const paymentsStats = await paymentsStatsResponse.json()
        const expensesStats = await expensesStatsResponse.json()

        const businessStats: BusinessStats = {
          totalIncome: paymentsStats.totalRevenue || 0,
          totalExpenses: expensesStats.overview?.totalExpenses || 0,
          netProfit: (paymentsStats.totalRevenue || 0) - (expensesStats.overview?.totalExpenses || 0),
          pendingIncome: paymentsStats.pendingAmount || 0,
          pendingExpenses: 0, // Expenses don't have pending status in current schema
          monthlyIncome: paymentsStats.monthlyRevenue || 0,
          monthlyExpenses: expensesStats.overview?.monthlyExpenses || 0,
          monthlyNetProfit: (paymentsStats.monthlyRevenue || 0) - (expensesStats.overview?.monthlyExpenses || 0)
        }

        setStats(businessStats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session && status === 'authenticated') {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        router.push('/auth/signin')
        return
      }
      fetchMovements()
      fetchStats()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [session, status, fetchMovements, router])

  const filteredMovements = movements.filter(movement => {
    const matchesType = filterType === 'all' || movement.type.toLowerCase() === filterType
    const matchesSearch = searchTerm === '' ||
      movement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.vendor?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesType && matchesSearch
  })

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage)

  if (status === 'loading' || loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return null
  }

  const breadcrumbItems = [
    { label: t.admin, href: '/admin/dashboard' },
    { label: t.businessDashboard, href: '/admin/business' }
  ]

  return (
    <div className="space-y-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t.businessDashboard}</h2>
            <p className="text-gray-600 mt-2">{t.financialOverview}</p>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/admin/business/expenses"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <ArrowDownIcon className="h-5 w-5" />
              <span>{t.expenses}</span>
            </Link>
            <Link
              href="/admin/business/payments"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <ArrowUpIcon className="h-5 w-5" />
              <span>{t.payments}</span>
            </Link>
          </div>
        </div>
      </div>

      {stats && (
        <>
          {/* Business Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.totalIncome}</p>
                  <p className="text-2xl font-bold text-gray-900">€{Number(stats.totalIncome).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ArrowDownIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.totalExpenses}</p>
                  <p className="text-2xl font-bold text-gray-900">€{Number(stats.totalExpenses).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stats.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <CurrencyEuroIcon className={`h-6 w-6 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.netProfit}</p>
                  <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{Number(stats.netProfit).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BanknotesIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.thisMonth}</p>
                  <p className={`text-2xl font-bold ${stats.monthlyNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{Number(stats.monthlyNetProfit).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder={t.searchFinancialMovements}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">{t.allMovements}</option>
                  <option value="income">{t.incomeOnly}</option>
                  <option value="expense">{t.expensesOnly}</option>
                </select>
              </div>
            </div>

            {/* Financial Movements Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.date}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.type}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.description}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.category}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.amount}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.status}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          movement.type === 'INCOME'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {movement.type === 'INCOME' ? (
                            <ArrowUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-3 w-3 mr-1" />
                          )}
                          {movement.type === 'INCOME' ? t.income : t.expense}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {movement.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.category || '-'}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        movement.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'INCOME' ? '+' : '-'}€{Number(movement.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {movement.status && (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            movement.status === 'PAID'
                              ? 'bg-green-100 text-green-800'
                              : movement.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : movement.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {movement.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-700">
                  {t.showingMovements
                    .replace('{start}', (((currentPage - 1) * itemsPerPage) + 1).toString())
                    .replace('{end}', Math.min(currentPage * itemsPerPage, filteredMovements.length).toString())
                    .replace('{total}', filteredMovements.length.toString())}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {t.previous}
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    {t.next}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
