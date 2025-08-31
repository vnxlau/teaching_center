'use client'

import { useState } from 'react'

interface AutoPaymentGeneratorProps {
  schoolYearId: string
  onPaymentsGenerated?: (result: any) => void
}

export default function AutoPaymentGenerator({ schoolYearId, onPaymentsGenerated }: AutoPaymentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth.getMonth() + 1
  })
  const [selectedYear, setSelectedYear] = useState(() => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    return nextMonth.getFullYear()
  })
  const [generationStatus, setGenerationStatus] = useState<any>(null)
  const [result, setResult] = useState<any>(null)

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  const checkGenerationStatus = async () => {
    try {
      const response = await fetch(
        `/api/admin/payments/auto-generate?month=${selectedMonth}&year=${selectedYear}&schoolYearId=${schoolYearId}`
      )
      const data = await response.json()
      setGenerationStatus(data)
    } catch (error) {
      console.error('Error checking generation status:', error)
    }
  }

  const generatePayments = async () => {
    setIsGenerating(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/payments/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetMonth: selectedMonth,
          targetYear: selectedYear,
          schoolYearId: schoolYearId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate payments')
      }

      setResult(data)
      onPaymentsGenerated?.(data)
      
      // Refresh status after generation
      await checkGenerationStatus()

    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Check status when month/year changes
  const handleDateChange = () => {
    setResult(null)
    setGenerationStatus(null)
    checkGenerationStatus()
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Automatic Payment Generation</h3>
          <p className="text-sm text-gray-600">Generate monthly payments for all active students</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Due date: 8th of selected month</span>
        </div>
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
            Target Month
          </label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(parseInt(e.target.value))
              handleDateChange()
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
            Target Year
          </label>
          <select
            id="year"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(parseInt(e.target.value))
              handleDateChange()
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      {/* Generation Status */}
      {generationStatus && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{generationStatus.monthName} Status</h4>
            {generationStatus.isComplete && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Complete
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Active Students</p>
              <p className="font-semibold text-gray-900">{generationStatus.activeStudentsCount}</p>
            </div>
            <div>
              <p className="text-gray-600">Generated Payments</p>
              <p className="font-semibold text-gray-900">{generationStatus.existingPaymentsCount}</p>
            </div>
            <div>
              <p className="text-gray-600">Pending Generation</p>
              <p className="font-semibold text-gray-900">{generationStatus.pendingGeneration}</p>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={generatePayments}
          disabled={isGenerating || (generationStatus?.isComplete)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Generate Payments
            </>
          )}
        </button>

        {generationStatus?.isComplete && (
          <span className="text-sm text-green-600 font-medium">
            All payments already generated for this month
          </span>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className="mt-6 p-4 rounded-lg border-2 border-dashed border-gray-200">
          {result.error ? (
            <div className="text-red-600">
              <h4 className="font-medium mb-1">Error</h4>
              <p className="text-sm">{result.error}</p>
            </div>
          ) : (
            <div className="text-green-600">
              <h4 className="font-medium mb-2">{result.message}</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Students</p>
                  <p className="font-semibold">{result.summary.totalStudents}</p>
                </div>
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-semibold text-green-600">{result.summary.created}</p>
                </div>
                <div>
                  <p className="text-gray-600">Skipped</p>
                  <p className="font-semibold text-yellow-600">{result.summary.skipped}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
