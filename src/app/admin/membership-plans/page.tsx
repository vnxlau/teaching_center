'use client'

import { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  UserGroupIcon, 
  CurrencyEuroIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface MembershipPlan {
  id: string
  name: string
  daysPerWeek: number
  monthlyPrice: number
  studentCount: number
}

interface PlanStats {
  totalPlans: number
  totalStudents: number
  totalRevenue: number
  currentMonthRevenue: number
  avgStudentsPerPlan: number
  mostPopularPlan: {
    id: string
    name: string
    studentCount: number
  } | null
  highestRevenuePlan: {
    id: string
    name: string
    totalRevenue: number
    monthlyRevenue: number
  } | null
  lowestRevenuePlan: {
    id: string
    name: string
    totalRevenue: number
    studentCount: number
  } | null
  plansByPopularity: Array<{
    id: string
    name: string
    studentCount: number
    monthlyPrice: number
  }>
  plansByRevenue: Array<{
    id: string
    name: string
    totalRevenue: number
    monthlyRevenue: number
    studentCount: number
  }>
}

export default function MembershipPlansPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [stats, setStats] = useState<PlanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    daysPerWeek: 1,
    monthlyPrice: 0
  })

  useEffect(() => {
    fetchPlans()
    fetchStats()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/membership-plans')
      const data = await response.json()
      setPlans(data.membershipPlans || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/membership-plans/stats')
      const data = await response.json()
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      daysPerWeek: plan.daysPerWeek,
      monthlyPrice: plan.monthlyPrice
    })
    setShowEditModal(true)
  }

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingPlan) return

    try {
      const response = await fetch(`/api/admin/membership-plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingPlan(null)
        setFormData({ name: '', daysPerWeek: 1, monthlyPrice: 0 })
        fetchPlans()
        fetchStats() // Refresh stats after updating a plan
      } else {
        console.error('Error updating plan')
      }
    } catch (error) {
      console.error('Error updating plan:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/admin/membership-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({ name: '', daysPerWeek: 1, monthlyPrice: 0 })
        fetchPlans()
        fetchStats() // Refresh stats after creating a plan
      } else {
        console.error('Error creating plan')
      }
    } catch (error) {
      console.error('Error creating plan:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage attendance plans and pricing for students
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Plan
        </button>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Plans */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Plans</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalPlans}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyEuroIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">€{stats.totalRevenue.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Current Month Revenue */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">This Month</dt>
                    <dd className="text-lg font-medium text-gray-900">€{stats.currentMonthRevenue.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Most Popular Plan */}
          {stats.mostPopularPlan && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden shadow rounded-lg border border-blue-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-blue-600 truncate">Most Popular Plan</dt>
                      <dd className="text-lg font-medium text-blue-900">{stats.mostPopularPlan.name}</dd>
                      <dd className="text-sm text-blue-700">{stats.mostPopularPlan.studentCount} students</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Highest Revenue Plan */}
          {stats.highestRevenuePlan && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 overflow-hidden shadow rounded-lg border border-green-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyEuroIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-green-600 truncate">Highest Revenue Plan</dt>
                      <dd className="text-lg font-medium text-green-900">{stats.highestRevenuePlan.name}</dd>
                      <dd className="text-sm text-green-700">€{stats.highestRevenuePlan.totalRevenue.toFixed(2)} total</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lowest Revenue Plan */}
          {stats.lowestRevenuePlan && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 overflow-hidden shadow rounded-lg border border-orange-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowTrendingDownIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-orange-600 truncate">Needs Attention</dt>
                      <dd className="text-lg font-medium text-orange-900">{stats.lowestRevenuePlan.name}</dd>
                      <dd className="text-sm text-orange-700">
                        {stats.lowestRevenuePlan.studentCount} students • €{stats.lowestRevenuePlan.totalRevenue.toFixed(2)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-gray-50"
            onClick={() => handleEditPlan(plan)}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {plan.daysPerWeek}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500">
                    {plan.daysPerWeek} {plan.daysPerWeek === 1 ? 'day' : 'days'} per week
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">
                    €{plan.monthlyPrice.toFixed(2)}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {plan.studentCount} {plan.studentCount === 1 ? 'student' : 'students'} enrolled
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <PlusIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">No membership plans</h3>
          <p className="text-sm text-gray-500 mb-4">
            Get started by creating your first membership plan.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Plan
          </button>
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Membership Plan</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Premium Plan"
                  />
                </div>

                <div>
                  <label htmlFor="daysPerWeek" className="block text-sm font-medium text-gray-700">
                    Days per Week
                  </label>
                  <select
                    id="daysPerWeek"
                    value={formData.daysPerWeek}
                    onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <option key={day} value={day}>{day} {day === 1 ? 'day' : 'days'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="monthlyPrice" className="block text-sm font-medium text-gray-700">
                    Monthly Price (€)
                  </label>
                  <input
                    type="number"
                    id="monthlyPrice"
                    required
                    min="0"
                    step="0.01"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Membership Plan</h3>
              
              <form onSubmit={handleUpdatePlan} className="space-y-4">
                <div>
                  <label htmlFor="editName" className="block text-sm font-medium text-gray-700">
                    Plan Name
                  </label>
                  <input
                    type="text"
                    id="editName"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Premium Plan"
                  />
                </div>

                <div>
                  <label htmlFor="editDaysPerWeek" className="block text-sm font-medium text-gray-700">
                    Days per Week
                  </label>
                  <select
                    id="editDaysPerWeek"
                    value={formData.daysPerWeek}
                    onChange={(e) => setFormData({ ...formData, daysPerWeek: parseInt(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                      <option key={day} value={day}>{day} {day === 1 ? 'day' : 'days'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="editMonthlyPrice" className="block text-sm font-medium text-gray-700">
                    Monthly Price (€)
                  </label>
                  <input
                    type="number"
                    id="editMonthlyPrice"
                    required
                    min="0"
                    step="0.01"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Important Note
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          This plan has {editingPlan.studentCount} enrolled student{editingPlan.studentCount !== 1 ? 's' : ''}. 
                          Price changes will affect future payments for these students.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingPlan(null)
                      setFormData({ name: '', daysPerWeek: 1, monthlyPrice: 0 })
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update Plan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
