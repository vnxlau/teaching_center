import { useEffect, useState } from 'react'

interface Subject {
  id: string
  name: string
  code: string
  description?: string
}

interface SubjectSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export default function SubjectSelect({ 
  value, 
  onChange, 
  placeholder = "Select a subject", 
  className = "",
  required = false 
}: SubjectSelectProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects')
      if (response.ok) {
        const data = await response.json()
        // Extract subjects array from the API response
        setSubjects(data.subjects || [])
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      setSubjects([]) // Ensure subjects is always an array
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <select 
        className={`block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 ${className}`}
        disabled
      >
        <option>Loading subjects...</option>
      </select>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 ${className}`}
      required={required}
    >
      <option value="">{placeholder}</option>
      {Array.isArray(subjects) && subjects.map((subject) => (
        <option key={subject.id} value={subject.id}>
          {subject.name} ({subject.code})
        </option>
      ))}
    </select>
  )
}
