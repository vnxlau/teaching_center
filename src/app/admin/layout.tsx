'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import OwlIcon from '@/components/icons/OwlIcon'
import {
  HomeIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CreditCardIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [schoolName, setSchoolName] = useState('Teaching Center')

  // Fetch school name from system settings
  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const response = await fetch('/api/admin/settings/system')
        if (response.ok) {
          const settings = await response.json()
          setSchoolName(settings.schoolName || 'Teaching Center')
        }
      } catch (error) {
        console.error('Failed to fetch school name:', error)
      }
    }
    
    fetchSchoolName()
    
    // Listen for system settings updates
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail?.schoolName) {
        setSchoolName(event.detail.schoolName)
      } else {
        // Refresh from API if schoolName not in the event detail
        fetchSchoolName()
      }
    }
    
    window.addEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener)
    
    return () => {
      window.removeEventListener('systemSettingsUpdated', handleSettingsUpdate as EventListener)
    }
  }, [])

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed))
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
  }, [session, status, router])

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const navigation = [
    {
      category: 'Overview',
      items: [
        { 
          name: 'Dashboard', 
          href: '/admin/dashboard', 
          icon: HomeIcon,
          current: pathname === '/admin/dashboard' 
        },
        { 
          name: 'Analytics', 
          href: '/admin/analytics', 
          icon: ChartBarIcon,
          current: pathname === '/admin/analytics' 
        },
      ]
    },
    {
      category: 'Management',
      items: [
        { 
          name: 'Students', 
          href: '/admin/students', 
          icon: AcademicCapIcon,
          current: pathname === '/admin/students' 
        },
        { 
          name: 'Parents', 
          href: '/admin/parents', 
          icon: UserGroupIcon,
          current: pathname === '/admin/parents' 
        },
        { 
          name: 'Membership Plans', 
          href: '/admin/membership-plans', 
          icon: ClipboardDocumentListIcon,
          current: pathname === '/admin/membership-plans' 
        },
        { 
          name: 'Student Distribution', 
          href: '/admin/student-distribution', 
          icon: UserGroupIcon,
          current: pathname === '/admin/student-distribution' 
        },
      ]
    },
    {
      category: 'Operations',
      items: [
        { 
          name: 'Academic', 
          href: '/admin/academic', 
          icon: BuildingOffice2Icon,
          current: pathname === '/admin/academic' 
        },
        { 
          name: 'Finance', 
          href: '/admin/finance', 
          icon: CreditCardIcon,
          current: pathname === '/admin/finance' 
        },
        { 
          name: 'Messages', 
          href: '/admin/messages', 
          icon: ChatBubbleLeftRightIcon,
          current: pathname === '/admin/messages' 
        },
      ]
    },
    {
      category: 'System',
      items: [
        { 
          name: 'Settings', 
          href: '/admin/settings', 
          icon: CogIcon,
          current: pathname === '/admin/settings' 
        },
      ]
    }
  ]

  // Flatten for mobile title lookup
  const allNavItems = navigation.flatMap(section => section.items)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64'
      }`}>
        <div className="flex flex-col w-full">
          {/* Logo */}
          <div className={`flex items-center justify-between h-16 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg transition-all duration-300 ${
            isCollapsed ? 'px-2' : 'px-6'
          }`}>
            <Link href="/admin/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <OwlIcon className="w-6 h-6 text-blue-600" />
              </div>
              {!isCollapsed && (
                <div className="text-white">
                  <h1 className="text-lg font-bold">{schoolName}</h1>
                  <p className="text-blue-100 text-xs">Admin Portal</p>
                </div>
              )}
            </Link>
            
            {/* Collapse Toggle Button */}
            <button
              onClick={toggleCollapsed}
              className={`p-1.5 rounded-md hover:bg-white/10 transition-colors text-white ${
                isCollapsed ? 'mx-auto' : ''
              }`}
            >
              {isCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto bg-white">
            {navigation.map((section) => (
              <div key={section.category}>
                {!isCollapsed && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.category}
                  </h3>
                )}
                <div className={`space-y-1 ${isCollapsed ? 'space-y-2' : ''}`}>
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          group flex items-center text-sm font-medium rounded-lg transition-all duration-200 relative
                          ${item.current
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }
                          ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-3 py-2.5'}
                        `}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon className={`
                          h-5 w-5 transition-colors flex-shrink-0
                          ${item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-500'}
                          ${isCollapsed ? '' : 'mr-3'}
                        `} />
                        {!isCollapsed && item.name}
                        
                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
                {!isCollapsed && section !== navigation[navigation.length - 1] && (
                  <div className="mt-4 border-t border-gray-200"></div>
                )}
              </div>
            ))}
          </nav>

          {/* User info and sign out */}
          <div className={`border-t border-gray-200 bg-gray-50 transition-all duration-300 ${
            isCollapsed ? 'p-2' : 'p-4'
          }`}>
            <div className={`flex items-center bg-white rounded-lg shadow-sm transition-all duration-300 ${
              isCollapsed ? 'justify-center p-2' : 'space-x-3 p-3'
            }`}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-medium text-sm">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    {session.user.role}
                  </p>
                </div>
              )}
              
              {/* Tooltip for collapsed user info */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {session.user.name} ({session.user.role})
                </div>
              )}
            </div>
            
            <button
              onClick={handleSignOut}
              className={`w-full flex items-center text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 border border-red-200 transition-all duration-200 hover:border-red-300 mt-3 group ${
                isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-center px-3 py-2.5'
              }`}
              title={isCollapsed ? 'Sign Out' : undefined}
            >
              <ArrowRightOnRectangleIcon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
              {!isCollapsed && 'Sign Out'}
              
              {/* Tooltip for collapsed sign out */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Sign Out
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
            <Link href="/admin/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <OwlIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-white">
                <h1 className="text-lg font-bold">{schoolName}</h1>
                <p className="text-blue-100 text-xs">Admin Portal</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-blue-200 p-1 rounded-md transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {navigation.map((section) => (
              <div key={section.category}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                          ${item.current
                            ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                          }
                        `}
                      >
                        <Icon className={`
                          mr-3 h-5 w-5 transition-colors
                          ${item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-500'}
                        `} />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Mobile User Profile */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-medium text-sm">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  {session.user.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 border border-red-200 transition-all duration-200 hover:border-red-300"
            >
              <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top bar for mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
              <OwlIcon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              {allNavItems.find(item => item.current)?.name || 'Admin Portal'}
            </h1>
          </div>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
