import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            include: {
              student: true,
              parent: true,
              staff: true
            }
          })

          if (!user) {
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Get additional user info based on role
          let additionalInfo = {}
          if (user.student) {
            additionalInfo = {
              studentId: user.student.id,
              studentCode: user.student.studentCode,
              grade: user.student.grade
            }
          } else if (user.parent) {
            additionalInfo = {
              parentId: user.parent.id
            }
          } else if (user.staff) {
            additionalInfo = {
              staffId: user.staff.id,
              position: user.staff.position
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            ...additionalInfo
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role
        token.studentId = user.studentId
        token.parentId = user.parentId
        token.staffId = user.staffId
        token.studentCode = user.studentCode
        token.grade = user.grade
        token.position = user.position
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.studentId = token.studentId
        session.user.parentId = token.parentId
        session.user.staffId = token.staffId
        session.user.studentCode = token.studentCode
        session.user.grade = token.grade
        session.user.position = token.position
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}
