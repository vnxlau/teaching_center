#!/usr/bin/env node

// Direct test of production database with explicit connection
import { PrismaClient } from '@prisma/client';

const PRODUCTION_DB_URL = "postgresql://postgres.ughljdbcetcizogtxwks:Ribmeu8MUS1Q6Q8p@aws-1-eu-west-2.pooler.supabase.com:5432/postgres";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PRODUCTION_DB_URL
    }
  }
});

async function testProductionData() {
  try {
    console.log('🔍 Testing Production Database with Direct Connection...');
    console.log('Database URL:', PRODUCTION_DB_URL.substring(0, 50) + '...');
    
    // Test connection and count records
    const userCount = await prisma.user.count();
    const studentCount = await prisma.student.count();
    const schoolYearCount = await prisma.schoolYear.count();
    
    console.log('\n📊 Production Database Status:');
    console.log(`✅ Users: ${userCount}`);
    console.log(`✅ Students: ${studentCount}`);
    console.log(`✅ School Years: ${schoolYearCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          name: true
        },
        take: 5
      });
      
      console.log('\n👥 Sample Users:');
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log('\n⚠️  No users found in production database!');
      
      // Check if we can insert a test record
      console.log('Testing if we can insert data...');
      try {
        const testUser = await prisma.user.create({
          data: {
            email: 'test@example.com',
            name: 'Test User',
            password: 'test123',
            role: 'ADMIN'
          }
        });
        console.log('✅ Successfully created test user:', testUser.email);
        
        // Clean up
        await prisma.user.delete({
          where: { id: testUser.id }
        });
        console.log('✅ Test user cleaned up');
      } catch (insertError) {
        console.error('❌ Cannot insert data:', insertError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing production database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProductionData();
