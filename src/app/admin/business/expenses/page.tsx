'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useNotification } from '@/components/NotificationProvider'
import LoadingSpinner from '@/components/LoadingSpinner'
import Breadcrumb from '@/components/Breadcrumb'
import Modal from '@/components/Modal'
import { useLanguage } from '@/contexts/LanguageContext'

interface Expense {
  id: string
  type: 'SERVICE' | 'MATERIALS' | 'DAILY_EMPLOYEES'
  description: string
  amount: number
  date: string
  category?: string
  vendor?: string
  notes?: string
  createdAt: string
  createdBy: string
}

interface ExpenseStats {
  overview: {
    totalExpenses: number
    monthlyExpenses: number
    serviceExpenses: number
    materialsExpenses: number
    dailyEmployeesExpenses: number
    expenseCount: number
  }
  monthlyBreakdown: Array<{
    month: string
    year: number
    totalAmount: number
    serviceAmount: number
    materialsAmount: number
    dailyEmployeesAmount: number
    expenseCount: number
  }>
  categoryBreakdown: Array<{
    category: string
    totalAmount: number
    percentage: number
    expenseCount: number
  }>
}

export default function ExpensesDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showNotification } = useNotification()
  const { t } = useLanguage()
  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [newExpense, setNewExpense] = useState({
    type: 'SERVICE' as const,
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    vendor: '',
    notes: ''
  })

  const [editExpense, setEditExpense] = useState({
    id: '',
    type: 'SERVICE' as const,
    description: '',
    amount: '',
    date: '',
    category: '',
    vendor: '',
    notes: ''
  })

  useEffect(() => {
    if (session && status === 'authenticated') {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF') {
        router.push('/auth/signin')
        return
      }
      fetchExpenses()
      fetchStats()
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [session, status])

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/admin/expenses')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      } else {
        showNotification(t.failedToLoadExpenses, 'error')
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error)
      showNotification(t.failedToLoadExpenses, 'error')
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/expenses/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        showNotification('Failed to load expense statistics', 'error')
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      showNotification(t.failedToLoadExpenseStats, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount)
        })
      })

      if (response.ok) {
        setShowAddModal(false)
        setNewExpense({
          type: 'SERVICE',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: '',
          vendor: '',
          notes: ''
        })
        fetchExpenses()
        fetchStats()
        showNotification(t.expenseAddedSuccessfully, 'success')
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || t.failedToAddExpense, 'error')
      }
    } catch (error) {
      console.error('Failed to add expense:', error)
      showNotification(t.failedToAddExpense, 'error')
    }
  }

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/admin/expenses/${editExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editExpense,
          amount: parseFloat(editExpense.amount)
        })
      })

      if (response.ok) {
        setShowEditModal(false)
        fetchExpenses()
        fetchStats()
        showNotification(t.expenseUpdatedSuccessfully, 'success')
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || t.failedToUpdateExpense, 'error')
      }
    } catch (error) {
      console.error('Failed to update expense:', error)
      showNotification(t.failedToUpdateExpense, 'error')
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(t.confirmDeleteExpense)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/expenses/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchExpenses()
        fetchStats()
        showNotification(t.expenseDeletedSuccessfully, 'success')
      } else {
        showNotification(t.failedToDeleteExpense, 'error')
      }
    } catch (error) {
      console.error('Failed to delete expense:', error)
      showNotification(t.failedToDeleteExpense, 'error')
    }
  }

  const openEditModal = (expense: Expense) => {
    setEditExpense({
      id: expense.id,
      type: expense.type,
      description: expense.description,
      amount: expense.amount.toString(),
      date: expense.date,
      category: expense.category || '',
      vendor: expense.vendor || '',
      notes: expense.notes || ''
    })
    setShowEditModal(true)
  }

  const openViewModal = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowViewModal(true)
  }

  // Filter expenses based on search and type
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || expense.type === filterType
    return matchesSearch && matchesType
  })

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (status === 'loading' || loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return null
  }

  const breadcrumbItems = [
    { label: 'Admin', href: '/admin/dashboard' },
    { label: 'Business', href: '/admin/business' },
    { label: t.expensesDashboard, href: '/admin/business/expenses' }
  ]

  return (
    <div className="space-y-8">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t.expensesDashboard}</h2>
            <p className="text-gray-600 mt-2">{t.trackManageExpenses}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
                          <span>{t.addExpense}</span>
          </button>
        </div>
      </div>

      {stats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.totalExpenses}</p>
                  <p className="text-2xl font-bold text-gray-900">€{Number(stats.overview.totalExpenses).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.thisMonth}</p>
                  <p className="text-2xl font-bold text-gray-900">€{Number(stats.overview.monthlyExpenses).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.services}</p>
                  <p className="text-2xl font-bold text-gray-900">€{Number(stats.overview.serviceExpenses).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t.materials}</p>
                  <p className="text-2xl font-bold text-gray-900">€{Number(stats.overview.materialsExpenses).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.expenseBreakdownByCategory}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.categoryBreakdown.map((category, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{category.category}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.amountLabel}</span>
                      <span className="font-medium">€{Number(category.totalAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.percentage}</span>
                      <span className="font-medium">{category.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t.count}</span>
                      <span className="font-medium">{category.expenseCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder={t.searchExpenses}
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
              <option value="all">{t.allTypes}</option>
              <option value="SERVICE">{t.services}</option>
              <option value="MATERIALS">{t.materials}</option>
              <option value="DAILY_EMPLOYEES">{t.dailyEmployees}</option>
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.date}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.type}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.description}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.vendor}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.amount}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      expense.type === 'SERVICE' ? 'bg-green-100 text-green-800' :
                      expense.type === 'MATERIALS' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {expense.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                    {expense.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense.vendor || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    €{Number(expense.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openViewModal(expense)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(expense)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {t.edit}
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t.delete}
                    </button>
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
              {t.showingExpenses
                .replace('{start}', (((currentPage - 1) * itemsPerPage) + 1).toString())
                .replace('{end}', Math.min(currentPage * itemsPerPage, filteredExpenses.length).toString())
                .replace('{total}', filteredExpenses.length.toString())}
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

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={t.addNewExpense}
      >
        <form onSubmit={handleAddExpense} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.type}</label>
              <select
                value={newExpense.type}
                onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="SERVICE">{t.services}</option>
                <option value="MATERIALS">{t.materials}</option>
                <option value="DAILY_EMPLOYEES">{t.dailyEmployees}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.amountEuro}</label>
              <input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.description}</label>
            <input
              type="text"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.date}</label>
              <input
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.vendor}</label>
              <input
                type="text"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.category}</label>
            <input
              type="text"
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t.utilitiesExample}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.additionalNotesDescription}</label>
            <textarea
              value={newExpense.notes}
              onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder={t.additionalNotes}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t.addExpense}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t.editExpense}
      >
        <form onSubmit={handleEditExpense} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.type}</label>
              <select
                value={editExpense.type}
                onChange={(e) => setEditExpense({ ...editExpense, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="SERVICE">{t.services}</option>
                <option value="MATERIALS">{t.materials}</option>
                <option value="DAILY_EMPLOYEES">{t.dailyEmployees}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.amountEuro}</label>
              <input
                type="number"
                step="0.01"
                value={editExpense.amount}
                onChange={(e) => setEditExpense({ ...editExpense, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.description}</label>
            <input
              type="text"
              value={editExpense.description}
              onChange={(e) => setEditExpense({ ...editExpense, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.date}</label>
              <input
                type="date"
                value={editExpense.date}
                onChange={(e) => setEditExpense({ ...editExpense, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t.vendor}</label>
              <input
                type="text"
                value={editExpense.vendor}
                onChange={(e) => setEditExpense({ ...editExpense, vendor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.category}</label>
            <input
              type="text"
              value={editExpense.category}
              onChange={(e) => setEditExpense({ ...editExpense, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={t.utilitiesExample}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.additionalNotesDescription}</label>
            <textarea
              value={editExpense.notes}
              onChange={(e) => setEditExpense({ ...editExpense, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder={t.additionalNotes}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t.updateExpense}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Expense Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={t.expenseDetails}
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.type}</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedExpense.type.replace('_', ' ')}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.amount}</h4>
                <p className="mt-1 text-sm text-gray-900">€{Number(selectedExpense.amount).toFixed(2)}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.date}</h4>
                <p className="mt-1 text-sm text-gray-900">{new Date(selectedExpense.date).toLocaleDateString()}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.vendor}</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedExpense.vendor || '-'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.description}</h4>
              <p className="mt-1 text-sm text-gray-900">{selectedExpense.description}</p>
            </div>

            {selectedExpense.category && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Category</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedExpense.category}</p>
              </div>
            )}

            {selectedExpense.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.additionalNotesDescription}</h4>
                <p className="mt-1 text-sm text-gray-900">{selectedExpense.notes}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t.created}</h4>
              <p className="mt-1 text-sm text-gray-900">{new Date(selectedExpense.createdAt).toLocaleString()}</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false)
                  openEditModal(selectedExpense)
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Edit Expense
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
