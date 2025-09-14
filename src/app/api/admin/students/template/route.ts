import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // CSV template with sample data
    const csvContent = `firstName,lastName,email,dateOfBirth,phone,address,emergencyContact,grade,notes,membershipPlanName,discountRate,parent1FirstName,parent1LastName,parent1Email,parent1Phone,parent1Relationship,parent2FirstName,parent2LastName,parent2Email,parent2Phone,parent2Relationship
John,Doe,john.doe@example.com,2010-05-15,+351 912 345 678,Rua das Flores 123,Dr. Silva,5th Grade,Good student,Weekly Plan 3 Days,10,Maria,Doe,maria.doe@example.com,+351 912 345 679,Mother,Carlos,Doe,carlos.doe@example.com,+351 912 345 680,Father
Jane,Smith,jane.smith@example.com,2009-08-20,+351 923 456 789,Avenida Central 456,Dr. Santos,6th Grade,Excellent performance,Weekly Plan 5 Days,0,Ana,Smith,ana.smith@example.com,+351 923 456 790,Mother,,Smith,,,`

    // Set headers for CSV download
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv')
    headers.set('Content-Disposition', 'attachment; filename="student_bulk_upload_template.csv"')

    return new NextResponse(csvContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}