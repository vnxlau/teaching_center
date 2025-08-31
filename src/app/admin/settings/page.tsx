'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import LanguageSelector from '@/components/LanguageSelector'

interface UserSettings {
  id: string
  email: string
  name: string
  phone?: string
  address?: string
  vatNumber?: string
  language: string
  emailNotifications: boolean
  smsNotifications: boolean
}

interface SystemSettings {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
  academicYear: string
  currency: string
  timezone: string
}

export default function AdminSettings() {
  const { data: session } = useSession()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'system'>('personal')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const [userResponse, systemResponse] = await Promise.all([
        fetch('/api/admin/settings/user'),
        fetch('/api/admin/settings/system')
      ])
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUserSettings(userData)
      }
      
      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        setSystemSettings(systemData)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userSettings) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userSettings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Personal settings saved successfully!' })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      setMessage({ type: 'error', text: 'Failed to save personal settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleSystemSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!systemSettings) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemSettings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'System settings saved successfully!' })
        
        // Dispatch custom event to notify layout components
        window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { 
          detail: systemSettings 
        }))
      } else {
        throw new Error('Failed to save system settings')
      }
    } catch (error) {
      console.error('Failed to save system settings:', error)
      setMessage({ type: 'error', text: 'Failed to save system settings' })
    } finally {
      setSaving(false)
    }
  }

  const updateUserSetting = (key: keyof UserSettings, value: any) => {
    if (!userSettings) return
    setUserSettings({ ...userSettings, [key]: value })
  }

  const updateSystemSetting = (key: keyof SystemSettings, value: any) => {
    if (!systemSettings) return
    setSystemSettings({ ...systemSettings, [key]: value })
  }

  if (!session) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading session...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Manage your personal information and system preferences</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'personal', name: 'Personal Settings' },
            { id: 'system', name: 'System Settings' },
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
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Settings Tab */}
      {activeTab === 'personal' && userSettings && (
        <form onSubmit={handleUserSave} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userSettings.name}
                  onChange={(e) => updateUserSetting('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userSettings.email}
                  onChange={(e) => updateUserSetting('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={userSettings.phone || ''}
                  onChange={(e) => updateUserSetting('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="+351 123 456 789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VAT Number
                </label>
                <input
                  type="text"
                  value={userSettings.vatNumber || ''}
                  onChange={(e) => updateUserSetting('vatNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="123456789"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={userSettings.address || ''}
                  onChange={(e) => updateUserSetting('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Your full address"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
            <div className="space-y-6">
              <div>
                <LanguageSelector />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive system notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userSettings.emailNotifications}
                      onChange={(e) => updateUserSetting('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                    <p className="text-sm text-gray-600">Receive important alerts via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userSettings.smsNotifications}
                      onChange={(e) => updateUserSetting('smsNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save Personal Settings'}
            </button>
          </div>
        </form>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && systemSettings && (
        <form onSubmit={handleSystemSave} className="space-y-6">
          {/* School Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name
                </label>
                <input
                  type="text"
                  value={systemSettings.schoolName}
                  onChange={(e) => updateSystemSetting('schoolName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Email
                </label>
                <input
                  type="email"
                  value={systemSettings.schoolEmail}
                  onChange={(e) => updateSystemSetting('schoolEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Phone
                </label>
                <input
                  type="tel"
                  value={systemSettings.schoolPhone}
                  onChange={(e) => updateSystemSetting('schoolPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={systemSettings.academicYear}
                  onChange={(e) => updateSystemSetting('academicYear', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="2024-2025"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Address
                </label>
                <textarea
                  value={systemSettings.schoolAddress}
                  onChange={(e) => updateSystemSetting('schoolAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* System Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={systemSettings.currency}
                  onChange={(e) => updateSystemSetting('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="BRL">Brazilian Real (BRL)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={systemSettings.timezone}
                  onChange={(e) => updateSystemSetting('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Europe/Lisbon">Europe/Lisbon</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {saving ? 'Saving...' : 'Save System Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
