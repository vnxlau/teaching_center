'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import AutoPaymentGenerator from '@/components/admin/AutoPaymentGenerator'
import { useNotification } from '@/components/NotificationProvider'
import Breadcrumb from '@/components/Breadcrumb'
import { useLanguage } from '@/contexts/LanguageContext'

interface Payment {
  id: string
  studentCode?: string
  studentName?: string
  amount: number
  dueDate: string
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentDate?: string
  description?: string
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
  const [monthFilter, setMonthFilter] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [students, setStudents] = useState<{ id: string, name: string, studentCode: string }[]>([])
  const [currentSchoolYearId, setCurrentSchoolYearId] = useState<string | null>(null)
  const [currentMonthStats, setCurrentMonthStats] = useState<any>(null)
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    month: '',
    description: ''
  })
  const [showPaymentReceivedModal, setShowPaymentReceivedModal] = useState(false)
  const [paymentReceived, setPaymentReceived] = useState({
    studentId: '',
    month: '',
    description: ''
  })
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [editPayment, setEditPayment] = useState({
    description: '',
    amount: 0
  })
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const { showNotification } = useNotification()
  const { t } = useLanguage()

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

  const createPayment = async () => {
    if (!newPayment.studentId || !newPayment.month) {
      showNotification(t.pleaseSelectStudentMonth, 'warning')
      return
    }

    try {
      // Get student details to determine amount
      const selectedStudent = students.find(s => s.id === newPayment.studentId)
      if (!selectedStudent) {
        showNotification(t.studentNotFound, 'error')
        return
      }

      // Calculate due date from selected month (last day of the month)
      const [year, month] = newPayment.month.split('-').map(Number)
      const dueDate = new Date(year, month, 0) // Last day of the month

      // Get student's membership plan amount
      let amount = 0
      try {
        const studentResponse = await fetch(`/api/admin/students/${newPayment.studentId}`)
        if (studentResponse.ok) {
          const studentData = await studentResponse.json()
          const student = studentData.student

          // Use monthlyDueAmount if available, otherwise use membership plan price
          if (student.monthlyDueAmount !== undefined && student.monthlyDueAmount !== null) {
            amount = Number(student.monthlyDueAmount)
          } else if (student.membershipPlan?.monthlyPrice) {
            amount = Number(student.membershipPlan.monthlyPrice)
          }
        }
      } catch (error) {
        console.error('Failed to fetch student details:', error)
      }

      if (amount <= 0) {
        showNotification(t.unableDetermineAmount, 'error')
        return
      }

      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: newPayment.studentId,
          month: newPayment.month,
          description: newPayment.description || `Monthly fee for ${dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        })
      })

      if (response.ok) {
        setNewPayment({
          studentId: '',
          month: '',
          description: ''
        })
        setShowPaymentModal(false)
        fetchFinancialData()
        showNotification(t.paymentRecordCreated, 'success')
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || t.failedCreatePaymentRecord, 'error')
      }
    } catch (error) {
      console.error('Failed to create payment:', error)
      showNotification(t.failedCreatePaymentRecord, 'error')
    }
  }

  const markPaymentReceived = async () => {
    if (!paymentReceived.studentId || !paymentReceived.month) {
      showNotification(t.pleaseSelectStudentMonth, 'warning')
      return
    }

    try {
      const response = await fetch('/api/admin/payments/mark-received', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: paymentReceived.studentId,
          month: paymentReceived.month,
          description: paymentReceived.description
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPaymentReceived({
          studentId: '',
          month: '',
          description: ''
        })
        setShowPaymentReceivedModal(false)
        fetchFinancialData()
        showNotification(data.message || t.paymentMarkedReceived, 'success')
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || t.failedMarkPaymentReceived, 'error')
      }
    } catch (error) {
      console.error('Failed to mark payment as received:', error)
      showNotification(t.failedMarkPaymentReceived, 'error')
    }
  }

  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        fetchFinancialData()
        showNotification(data.message || t.paymentMarkedPaid, 'success')
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || t.failedMarkPaymentPaid, 'error')
      }
    } catch (error) {
      console.error('Failed to mark payment as paid:', error)
      showNotification(t.failedMarkPaymentPaid, 'error')
    }
  }

  const viewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowViewModal(true)
  }

  const editPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setEditPayment({
      description: payment.description || '',
      amount: payment.amount
    })
    setShowEditModal(true)
  }

  const updatePayment = async () => {
    if (!selectedPayment) return

    try {
      const response = await fetch(`/api/admin/payments/${selectedPayment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editPayment.description,
          amount: editPayment.amount
        })
      })

      if (response.ok) {
        const data = await response.json()
        setShowEditModal(false)
        setSelectedPayment(null)
        fetchFinancialData()
        showNotification(data.message || t.paymentUpdatedSuccessfully, 'success')
      } else {
        const errorData = await response.json()
        showNotification(errorData.error || t.failedUpdatePayment, 'error')
      }
    } catch (error) {
      console.error('Failed to update payment:', error)
      showNotification(t.failedUpdatePayment, 'error')
    }
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

  const openPaymentModal = () => {
    fetchStudents()
    setShowPaymentModal(true)
  }

  const openPaymentReceivedModal = () => {
    fetchStudents()
    setShowPaymentReceivedModal(true)
  }

  const handleCardFilter = (filterType: string) => {
    setFilterStatus(filterType)
    setSearchTerm('') // Clear search when using card filters
    setMonthFilter('all') // Reset month filter when using status filters
  }

  const handleMonthFilter = (monthValue: string) => {
    setMonthFilter(monthValue)
    setSearchTerm('') // Clear search when using month filter
  }

  const generateReport = () => {
    // Calculate report data from current filtered payments
    const totalPayments = filteredPayments.length
    const paidPayments = filteredPayments.filter(p => p.status === 'PAID')
    const pendingPayments = filteredPayments.filter(p => p.status === 'PENDING')
    const overduePayments = filteredPayments.filter(p => p.status === 'OVERDUE')

    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
    const paidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0)
    const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0)

    const report = {
      generatedAt: new Date().toLocaleString(),
      filters: {
        status: filterStatus,
        month: monthFilter,
        search: searchTerm
      },
      summary: {
        totalPayments,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        overduePayments: overduePayments.length,
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paidAmount.toFixed(2),
        pendingAmount: pendingAmount.toFixed(2),
        overdueAmount: overdueAmount.toFixed(2),
        paidPercentage: totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : '0'
      },
      payments: filteredPayments.map(p => ({
        studentName: p.studentName,
        studentCode: p.studentCode,
        amount: p.amount.toFixed(2),
        status: p.status,
        dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString() : 'N/A',
        paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : t.notPaid,
        description: p.description
      }))
    }

    setReportData(report)
    setShowReportModal(true)
  }

  const getCurrentMonthName = () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      (payment.studentName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.studentCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' || (payment.status?.toLowerCase() || '') === filterStatus.toLowerCase()

    const matchesMonth = monthFilter === 'all' || (() => {
      if (!payment.dueDate) return false
      const paymentDate = new Date(payment.dueDate)
      const paymentMonth = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
      return paymentMonth === monthFilter
    })()

    return matchesSearch && matchesFilter && matchesMonth
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
    <>
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .modal-content,
          .modal-content * {
            visibility: visible;
          }
          .modal-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
        }
      `}</style>
      <div className="space-y-8">
        <Breadcrumb items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Business', href: '/admin/business' },
          { label: 'Payments Dashboard', href: '/admin/business/payments' }
        ]} />
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{t.financialManagement}</h2>
              <p className="text-gray-600 mt-2">{t.trackPaymentsBilling}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={generateReport}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.generateReport}
            </button>
            <button
              onClick={openPaymentModal}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t.addPayment}
            </button>
            <button
              onClick={openPaymentReceivedModal}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              {t.paymentReceived}
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
                      <p className="text-sm font-medium text-gray-600">{t.duePayments}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-blue-600">
                          {currentMonthStats.stats.totalPayments.count}
                        </span>
                        <span className="text-sm text-gray-500">{t.payments}</span>
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
                      <p className="text-sm font-medium text-gray-600">{t.paid}</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-green-600">
                          {currentMonthStats.stats.paidPayments.count}
                        </span>
                        <span className="text-sm text-gray-500">{t.payments}</span>
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
                  <p className="text-sm font-medium text-gray-600">{t.totalRevenue}</p>
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
                  <p className="text-sm font-medium text-gray-600">{t.pending}</p>
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
                  <p className="text-sm font-medium text-gray-600">{t.overdue}</p>
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
                  placeholder={t.searchByStudentNameId}
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
                <option value="paid">{t.paid}</option>
                <option value="pending">{t.pending}</option>
                <option value="overdue">{t.overdue}</option>
                <option value="cancelled">{t.cancelled}</option>
              </select>
            </div>
            <div className="md:w-48">
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                {t.filterByMonth}
              </label>
              <select
                id="month"
                value={monthFilter}
                onChange={(e) => handleMonthFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date()
                  date.setMonth(date.getMonth() - i)
                  const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                  const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  return (
                    <option key={monthValue} value={monthValue}>
                      {monthName}
                    </option>
                  )
                })}
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
              {searchTerm || filterStatus !== 'all' || monthFilter !== 'all'
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
                      {t.student}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.description}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.amount}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.dueDate}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t.status}
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
                          <div className="text-sm font-medium text-gray-900">{payment.studentName || t.unknownStudent}</div>
                          <div className="text-sm text-gray-500">{t.id}: {payment.studentCode || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.description || t.noDescription}</div>
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status || 'PENDING')}`}>
                          {payment.status || 'PENDING'}
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
                            onClick={() => editPaymentDetails(payment)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          {(payment.status || 'PENDING') === 'PENDING' && (
                            <button
                              onClick={() => markPaymentAsPaid(payment.id)}
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
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              id="month"
              value={newPayment.month}
              onChange={(e) => setNewPayment({ ...newPayment, month: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a month...</option>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setMonth(date.getMonth() + i)
                const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              id="description"
              value={newPayment.description}
              onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Additional notes or description"
            />
          </div>

          {/* Display calculated information */}
          {newPayment.studentId && newPayment.month && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">{t.paymentDetailsPreview}</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div>{t.paymentDateLabel} {new Date().toLocaleDateString()}</div>
                <div>{t.dueDate}: {new Date(parseInt(newPayment.month.split('-')[0]), parseInt(newPayment.month.split('-')[1]), 0).toLocaleDateString()}</div>
                <div>Status: {t.pendingStatus}</div>
                <div>{t.typeLabel} {t.monthlyFee}</div>
              </div>
            </div>
          )}

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

      {/* Payment Received Modal */}
      <Modal
        isOpen={showPaymentReceivedModal}
        onClose={() => setShowPaymentReceivedModal(false)}
        title="Mark Payment as Received"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student
            </label>
            <select
              value={paymentReceived.studentId}
              onChange={(e) => setPaymentReceived({ ...paymentReceived, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Choose a student...</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={paymentReceived.month}
              onChange={(e) => setPaymentReceived({ ...paymentReceived, month: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">Choose a month...</option>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setMonth(i)
                const monthValue = `${date.getFullYear()}-${String(i + 1).padStart(2, '0')}`
                const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                return (
                  <option key={monthValue} value={monthValue}>
                    {monthName}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={paymentReceived.description}
              onChange={(e) => setPaymentReceived({ ...paymentReceived, description: e.target.value })}
              placeholder="Add any notes about this payment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowPaymentReceivedModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={markPaymentReceived}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark as Received
            </button>
          </div>
        </div>
      </Modal>

      {/* View Payment Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={t.paymentDetails}
      >
        <div className="space-y-6">
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.studentName || t.unknownStudent}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student Code</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.studentCode || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-sm text-gray-900">€{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.status || 'PENDING'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.dueDate}</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedPayment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t.paymentDateLabel.replace(':', '')}</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedPayment.paymentDate ? new Date(selectedPayment.paymentDate).toLocaleDateString() : t.notPaid}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">{t.description}</label>
                <p className="mt-1 text-sm text-gray-900">{selectedPayment.description || t.noDescription}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Payment"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={editPayment.amount}
              onChange={(e) => setEditPayment({ ...editPayment, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={editPayment.description}
              onChange={(e) => setEditPayment({ ...editPayment, description: e.target.value })}
              placeholder="Payment description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={updatePayment}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Payment
            </button>
          </div>
        </div>
      </Modal>

      {/* Financial Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={t.financialReport}
        printOnly={true}
      >
        <div className="space-y-6 max-w-[70vw] max-h-[99vw] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible" style={{aspectRatio: '1 / 1.414'}}>
          {reportData && (
            <div className="space-y-6 print:space-y-4">
              {/* Report Header */}
              <div className="bg-blue-50 p-4 rounded-lg print:bg-white print:p-2">
                <h3 className="text-lg font-semibold text-blue-900 mb-2 print:text-black">{t.reportSummary}</h3>
                <p className="text-sm text-blue-700 print:text-gray-700">Generated on: {reportData.generatedAt}</p>
                <div className="mt-2 text-sm text-blue-700 print:text-gray-700">
                  <p>Status Filter: {reportData.filters.status === 'all' ? 'All' : reportData.filters.status}</p>
                  <p>Month Filter: {reportData.filters.month === 'all' ? 'All Months' : reportData.filters.month}</p>
                  {reportData.filters.search && <p>Search: &quot;{reportData.filters.search}&quot;</p>}
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-2 print:gap-2">
                <div className="bg-green-50 p-4 rounded-lg print:bg-white print:p-2 print:border print:border-green-200">
                  <div className="text-2xl font-bold text-green-600 print:text-green-800">€{reportData.summary.paidAmount}</div>
                  <div className="text-sm text-green-700 print:text-green-800">Paid Amount</div>
                  <div className="text-xs text-green-600 mt-1 print:text-green-700">{reportData.summary.paidPayments} payments</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg print:bg-white print:p-2 print:border print:border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600 print:text-yellow-800">€{reportData.summary.pendingAmount}</div>
                  <div className="text-sm text-yellow-700 print:text-yellow-800">{t.pendingAmount}</div>
                  <div className="text-xs text-yellow-600 mt-1 print:text-yellow-700">{reportData.summary.pendingPayments} payments</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg print:bg-white print:p-2 print:border print:border-red-200">
                  <div className="text-2xl font-bold text-red-600 print:text-red-800">€{reportData.summary.overdueAmount}</div>
                  <div className="text-sm text-red-700 print:text-red-800">{t.overdueAmount}</div>
                  <div className="text-xs text-red-600 mt-1 print:text-red-700">{reportData.summary.overduePayments} payments</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg print:bg-white print:p-2 print:border print:border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 print:text-blue-800">{reportData.summary.paidPercentage}%</div>
                  <div className="text-sm text-blue-700 print:text-blue-800">{t.collectionRate}</div>
                  <div className="text-xs text-blue-600 mt-1 print:text-blue-700">{t.ofTotalAmount}</div>
                </div>
              </div>

              {/* Payment Details Table */}
              <div className="print:mt-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 print:text-base print:mb-2 print:text-gray-800">{t.paymentDetailsTitle} ({reportData.payments.length} payments)</h4>
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="min-w-full divide-y divide-gray-200 print:divide-gray-300 print:border print:border-gray-300">
                    <thead className="bg-gray-50 print:bg-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-gray-700">{t.student}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-gray-700">{t.amount}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-gray-700">{t.status}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-gray-700">{t.dueDate}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-gray-700">{t.paymentDateLabel.replace(':', '')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                      {reportData.payments.slice(0, 10).map((payment: any, index: number) => (
                        <tr key={index} className="text-sm print:border-b print:border-gray-300">
                          <td className="px-3 py-2 print:px-2 print:py-1">
                            <div>
                              <div className="font-medium text-gray-900 print:text-gray-800">{payment.studentName}</div>
                              <div className="text-gray-500 print:text-gray-600">{payment.studentCode}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2 font-medium print:px-2 print:py-1 print:text-gray-800">€{payment.amount}</td>
                          <td className="px-3 py-2 print:px-2 print:py-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full print:border ${
                              payment.status === 'PAID' ? 'bg-green-100 text-green-800 print:bg-white print:text-green-800 print:border-green-300' :
                              payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 print:bg-white print:text-yellow-800 print:border-yellow-300' :
                              'bg-red-100 text-red-800 print:bg-white print:text-red-800 print:border-red-300'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 print:px-2 print:py-1 print:text-gray-800">{payment.dueDate}</td>
                          <td className="px-3 py-2 print:px-2 print:py-1 print:text-gray-800">{payment.paymentDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reportData.payments.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2 text-center print:text-xs print:mt-1 print:text-gray-600">
                      {t.showingFirst10.replace('{total}', reportData.payments.length.toString())}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t print:hidden">
            <button
              onClick={() => setShowReportModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                // Simple export functionality - could be enhanced to export to PDF/Excel
                const reportText = `
${t.financialReport} - ${reportData.generatedAt}

SUMMARY:
- ${t.totalPayments}: ${reportData.summary.totalPayments}
- ${t.paid}: €${reportData.summary.paidAmount} (${reportData.summary.paidPayments} payments)
- ${t.pending}: €${reportData.summary.pendingAmount} (${reportData.summary.pendingPayments} payments)
- ${t.overdue}: €${reportData.summary.overdueAmount} (${reportData.summary.overduePayments} payments)
- ${t.collectionRate}: ${reportData.summary.paidPercentage}%

FILTERS:
- Status: ${reportData.filters.status}
- Month: ${reportData.filters.month}
- Search: ${reportData.filters.search || 'None'}
                `.trim()

                navigator.clipboard.writeText(reportText)
                showNotification('Report copied to clipboard!', 'success')
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Copy Report
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Print Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </>
  )
}
