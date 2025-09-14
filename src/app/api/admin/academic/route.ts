import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'subjects') {
      const subjects = await prisma.subject.findMany({
        orderBy: { name: 'asc' }
      });
      return NextResponse.json(subjects);
    }

    // Get all tests with subjects and related data
    const tests = await prisma.test.findMany({
      include: {
        subject: true,
        staff: true,
        schoolYear: true,
        results: {
          include: {
            student: true
          }
        }
      },
      orderBy: { scheduledDate: 'desc' }
    });

    // Calculate stats
    const totalTests = tests.length;
    const upcomingTests = tests.filter(test => 
      new Date(test.scheduledDate) > new Date() && test.isActive
    ).length;
    const completedTests = tests.filter(test => 
      new Date(test.scheduledDate) <= new Date() && test.isActive
    ).length;
    // Calculate average test score (placeholder - would need actual results)
    const averageTestScore = 85.5; // Placeholder

    const stats = {
      totalTests,
      upcomingTests,
      completedTests,
      totalSubjects: 0, // Would need to query subjects
      averageTestScore
    };

    return NextResponse.json({
      tests,
      stats
    });
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'test') {
      const { schoolYearId, staffId, subjectId, title, description, scheduledDate, maxScore } = data;

      if (!schoolYearId || !staffId || !subjectId || !title || !scheduledDate || !maxScore) {
        return NextResponse.json(
          { error: 'School Year ID, Staff ID, Subject ID, title, scheduled date, and max score are required' },
          { status: 400 }
        );
      }

      const test = await prisma.test.create({
        data: {
          schoolYearId,
          staffId,
          subjectId,
          title,
          description: description || '',
          scheduledDate: new Date(scheduledDate),
          maxScore: parseFloat(maxScore),
          isActive: true
        },
        include: {
          subject: true,
          staff: true,
          schoolYear: true
        }
      });

      return NextResponse.json(test, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid type specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating academic data:', error);
    return NextResponse.json(
      { error: 'Failed to create academic data' },
      { status: 500 }
    );
  }
}
