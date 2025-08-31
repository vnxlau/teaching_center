'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface Payment {
  id: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: 'PENDING' | 'PAID' | 'OVERDUE'
  paymentType: 'MONTHLY_FEE' | 'REGISTRATION' | 'MATERIALS' | 'EXAM_FEE' | 'OTHER'
  method?: string
  description?: string
}

export default function StudentPayments() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/student/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(payment => {
    switch (activeTab) {
      case 'pending':
        return payment.status === 'PENDING'
      case 'paid':
        return payment.status === 'PAID'
      case 'overdue':
        return payment.status === 'OVERDUE'
      default:
        return true
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'OVERDUE':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'MONTHLY_FEE':
        return 'Monthly Fee'
      case 'REGISTRATION':
        return 'Registration'
      case 'MATERIALS':
        return 'Materials'
      case 'EXAM_FEE':
        return 'Exam Fee'
      default:
        return 'Other'
    }
  }

  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalPending = payments
    .filter(p => p.status === 'PENDING' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + p.amount, 0)

  if (!session) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading session...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Payments</h2>
        <p className="text-gray-600 mt-2">View your payment history and upcoming dues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">€{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">€{totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Payments</p>
              <p className="text-2xl font-bold text-blue-900">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'all', name: 'All Payments', count: payments.length },
            { id: 'pending', name: 'Pending', count: payments.filter(p => p.status === 'PENDING').length },
            { id: 'paid', name: 'Paid', count: payments.filter(p => p.status === 'PAID').length },
            { id: 'overdue', name: 'Overdue', count: payments.filter(p => p.status === 'OVERDUE').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {activeTab === 'all' ? '' : activeTab} payments found
          </h3>
          <p className="text-gray-600">
            {activeTab === 'pending' 
              ? "You don't have any pending payments."
              : activeTab === 'paid'
              ? "No payment history available."
              : activeTab === 'overdue'
              ? "You don't have any overdue payments."
              : "No payment records found."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getPaymentTypeLabel(payment.paymentType)}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      📅 Due: {new Date(payment.dueDate).toLocaleDateString()}
                    </span>
                    {payment.paidDate && (
                      <span className="flex items-center gap-1">
                        ✅ Paid: {new Date(payment.paidDate).toLocaleDateString()}
                      </span>
                    )}
                    {payment.method && (
                      <span className="flex items-center gap-1">
                        💳 {payment.method}
                      </span>
                    )}
                  </div>
                  {payment.description && (
                    <p className="text-gray-600 text-sm">{payment.description}</p>
                  )}
                </div>

                {/* Amount Display */}
                <div className="text-right ml-6">
                  <div className="text-2xl font-bold text-gray-900">
                    €{payment.amount.toFixed(2)}
                  </div>
                  {payment.status === 'OVERDUE' && (
                    <div className="text-sm text-red-600 font-medium">
                      Overdue
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Actions for Pending/Overdue */}
              {(payment.status === 'PENDING' || payment.status === 'OVERDUE') && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Contact the school administration to make this payment.
                      </p>
                    </div>
                    <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm">
                      Contact Admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Payment Information</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Contact the school administration for payment methods and instructions</p>
          <p>• Payments can typically be made via bank transfer, cash, or card</p>
          <p>• Late payment fees may apply for overdue payments</p>
          <p>• For any payment-related questions, please speak with the administrative staff</p>
        </div>
      </div>
    </div>
  )
}
