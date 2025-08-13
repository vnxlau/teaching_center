import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role: 'ADMIN' | 'STAFF' | 'STUDENT' | 'PARENT'
    studentId?: string
    parentId?: string
    staffId?: string
    studentCode?: string
    grade?: string
    position?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'ADMIN' | 'STAFF' | 'STUDENT' | 'PARENT'
      studentId?: string
      parentId?: string
      staffId?: string
      studentCode?: string
      grade?: string
      position?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'STAFF' | 'STUDENT' | 'PARENT'
    studentId?: string
    parentId?: string
    staffId?: string
    studentCode?: string
    grade?: string
    position?: string
  }
}
