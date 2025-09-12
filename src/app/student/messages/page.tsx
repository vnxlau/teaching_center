'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

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

export default function StudentMessagesPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [staff, setStaff] = useState<{ id: string; name: string; email: string; role: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox')
  const [newMessage, setNewMessage] = useState({
    to: '',
    subject: '',
    content: ''
  })

  useEffect(() => {
    fetchMessages()
    fetchStaff()
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/student/messages')
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
      const response = await fetch('/api/student/staff')
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
      alert(t.pleaseFillAllFields)
      return
    }

    try {
      const response = await fetch('/api/student/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: newMessage.to,
          subject: newMessage.subject,
          content: newMessage.content
        })
      })

      if (response.ok) {
        setNewMessage({ to: '', subject: '', content: '' })
        setActiveTab('sent')
        fetchMessages()
        alert(t.messageSentSuccessfully)
      } else {
        alert(t.failedToSendMessage)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert(t.failedToSendMessage)
    }
  }

  if (!session) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t.loadingSession}</p>
      </div>
    )
  }

  const messageContent = (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.messages}</h1>
        <button
          onClick={() => setActiveTab('compose')}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          + {t.newMessage}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['inbox', 'sent', 'compose'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'inbox' ? t.received : tab === 'sent' ? t.sent : t.compose}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.receivedMessages}</h2>
          {messages.filter(m => m.toUser.id === session.user.id).length === 0 ? (
            <p className="text-gray-500">{t.noMessagesReceived}</p>
          ) : (
            <div className="space-y-3">
              {messages
                .filter(m => m.toUser.id === session.user.id)
                .map((message) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{message.subject}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{t.from}: {message.fromUser.name}</p>
                    <p className="text-gray-700">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sent' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.sentMessages}</h2>
          {messages.filter(m => m.fromUser.id === session.user.id).length === 0 ? (
            <p className="text-gray-500">{t.noMessagesSent}</p>
          ) : (
            <div className="space-y-3">
              {messages
                .filter(m => m.fromUser.id === session.user.id)
                .map((message) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{message.subject}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{t.to}: {message.toUser.name}</p>
                    <p className="text-gray-700">{message.content}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'compose' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{t.composeMessage}</h2>
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.to}</label>
              <select
                value={newMessage.to}
                onChange={(e) => setNewMessage({ ...newMessage, to: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">{t.selectRecipient}</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 transition-colors"
            >
              {t.sendMessage}
            </button>
          </form>
        </div>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-lg shadow-sm">{messageContent}</div>
  )
}
