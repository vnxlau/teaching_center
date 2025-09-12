'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

interface Message {
  id: string
  subject: string
  content: string
  fromUser: {
    id: string
    name: string
    role: string
  }
  toUser: {
    id: string
    name: string
    role: string
  }
  createdAt: string
  read: boolean
  priority: 'LOW' | 'NORMAL' | 'HIGH'
}

interface Conversation {
  id: string
  participants: {
    id: string
    name: string
    role: string
  }[]
  lastMessage: {
    content: string
    createdAt: string
    fromName: string
  }
  unreadCount: number
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox')
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH'
  })

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

    fetchMessages()
    fetchUsers()
  }, [session, status, router])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/admin/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content) {
      alert(t.fillAllFields)
      return
    }

    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: newMessage.to,
          subject: newMessage.subject,
          content: newMessage.content,
          priority: newMessage.priority
        })
      })

      if (response.ok) {
        setNewMessage({ to: '', subject: '', content: '', priority: 'NORMAL' })
        setActiveTab('sent')
        fetchMessages()
        alert(t.messageSentSuccessfully)
      } else {
        alert(t.failedToSendMessage)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/admin/messages/${messageId}/read`, {
        method: 'PUT'
      })
      fetchMessages()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleSignOut = async () => {
    const { signOut } = await import('next-auth/react')
    await signOut({ callbackUrl: '/' })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'NORMAL': return 'bg-blue-100 text-blue-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{t.messageCenter}</h2>
              <p className="text-gray-600 mt-2">{t.sendReceiveMessages}</p>
            </div>
            <button
              onClick={() => setActiveTab('compose')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              {t.newMessage}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inbox'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.inboxTab} ({messages.filter(m => m.toUser.id === session.user.id && !m.read).length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sent'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.sentTab}
              </button>
              <button
                onClick={() => setActiveTab('compose')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'compose'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {t.composeTab}
              </button>
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.loading} messages...</p>
          </div>
        ) : activeTab === 'compose' ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">{t.compose} {t.newMessage}</h3>
            <div className="space-y-6">
              <div>
                <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.toLabel}
                </label>
                <select
                  id="to"
                  value={newMessage.to}
                  onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">{t.selectRecipient}</option>
                  <optgroup label={t.groups}>
                    <option value="all-staff">{t.allStaff}</option>
                    <option value="all-parents">{t.allParents}</option>
                    <option value="all-students">{t.allStudents}</option>
                  </optgroup>
                  {users.length > 0 && (
                    <optgroup label={t.individualUsers}>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role.toLowerCase()}) - {user.email}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.priorityLabel}
                </label>
                <select
                  id="priority"
                  value={newMessage.priority}
                  onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value as 'LOW' | 'NORMAL' | 'HIGH' })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="LOW">{t.lowPriority}</option>
                  <option value="NORMAL">{t.normalPriority}</option>
                  <option value="HIGH">{t.highPriority}</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.subjectLabel}
                </label>
                <input
                  type="text"
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t.enterSubject}
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.contentLabel}
                </label>
                <textarea
                  id="content"
                  rows={6}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t.enterMessage}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setActiveTab('inbox')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={sendMessage}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {t.sendMessage}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {(activeTab === 'inbox' ? messages.filter(m => m.toUser.id === session.user.id) : messages.filter(m => m.fromUser.id === session.user.id)).length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t.noMessages}</h3>
                <p className="text-gray-600">
                  {activeTab === 'inbox' ? t.noInboxMessages : t.noSentMessages}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {(activeTab === 'inbox' ? messages.filter(m => m.toUser.id === session.user.id) : messages.filter(m => m.fromUser.id === session.user.id)).map((message) => (
                  <div
                    key={message.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer ${!message.read && activeTab === 'inbox' ? 'bg-blue-50' : ''}`}
                    onClick={() => {
                      if (activeTab === 'inbox' && !message.read) {
                        markAsRead(message.id)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            {activeTab === 'inbox' ? `${t.fromLabel}: ${message.fromUser.name}` : `${t.toLabel}: ${message.toUser.name}`}
                          </p>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(message.priority)}`}>
                            {message.priority}
                          </span>
                          {!message.read && activeTab === 'inbox' && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {t.unreadStatus}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{message.subject}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2">{message.content}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()} {t.at}{' '}
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  )
}
