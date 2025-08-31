'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Message {
  id: string
  subject: string
  content: string
  createdAt: string
  isRead: boolean
  fromUser: {
    id: string
    name: string
    email: string
    role: string
  }
  toUser: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function ParentMessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [staff, setStaff] = useState<{ id: string; name: string; email: string; role: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox')
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

    if (session.user.role !== 'PARENT') {
      router.push('/auth/signin')
      return
    }

    fetchMessages()
    fetchStaff()
  }, [session, status, router])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/parent/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/parent/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data.staff || [])
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/parent/messages', {
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
        alert('Message sent successfully!')
      } else {
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    }
  }

  const handleSignOut = () => {
    router.push('/auth/signin')
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  }

  if (!session || session.user.role !== 'PARENT') {
    return null
  }

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 pt-4">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'inbox'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Inbox
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sent'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sent
              </button>
              <button
                onClick={() => setActiveTab('compose')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'compose'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Compose
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'compose' ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Compose New Message</h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                      To
                    </label>
                    <select
                      id="to"
                      value={newMessage.to}
                      onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select recipient...</option>
                      <option value="all-staff">All Staff</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role.toLowerCase()}) - {member.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter message subject"
                    />
                  </div>

                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="content"
                      rows={6}
                      value={newMessage.content}
                      onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Type your message here..."
                    />
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={newMessage.priority}
                      onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value as 'LOW' | 'NORMAL' | 'HIGH' })}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={sendMessage}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'inbox' ? 'Inbox' : 'Sent Messages'}
                </h3>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(activeTab === 'inbox' ? messages.filter(m => m.toUser.id === session.user.id) : messages.filter(m => m.fromUser.id === session.user.id)).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-4">📭</div>
                        <p className="text-gray-600">
                          {activeTab === 'inbox' ? 'No messages in your inbox.' : 'No sent messages.'}
                        </p>
                      </div>
                    ) : (
                      (activeTab === 'inbox' ? messages.filter(m => m.toUser.id === session.user.id) : messages.filter(m => m.fromUser.id === session.user.id)).map((message) => (
                        <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{message.subject}</h4>
                              <p className="text-sm text-gray-600">
                                {activeTab === 'inbox' ? `From: ${message.fromUser.name}` : `To: ${message.toUser.name}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleDateString()} {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {!message.isRead && activeTab === 'inbox' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 text-sm">{message.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  )
}
