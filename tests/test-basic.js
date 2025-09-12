#!/usr/bin/env node

/**
 * Simple API and Database Test for Teaching Center Management System
 */

const BASE_URL = 'http://localhost:3004'

async function testAPI() {
  console.log('🧪 Testing Teaching Center Management System APIs')
  console.log('=' .repeat(50))

  const tests = [
    {
      name: 'Home Page',
      url: '/',
      expectedStatus: 200
    },
    {
      name: 'Sign In Page',
      url: '/auth/signin',
      expectedStatus: 200
    },
    {
      name: 'Auth Session API (Unauthorized)',
      url: '/api/auth/session',
      expectedStatus: [200, 401]
    },
    {
      name: 'Admin Stats API (Unauthorized)', 
      url: '/api/admin/stats',
      expectedStatus: [401, 403]
    },
    {
      name: 'Student Dashboard API (Unauthorized)',
      url: '/api/student/dashboard', 
      expectedStatus: [401, 403]
    },
    {
      name: 'Parent Dashboard API (Unauthorized)',
      url: '/api/parent/dashboard',
      expectedStatus: [401, 403]
    }
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      console.log(`\nTesting: ${test.name}`)
      const response = await fetch(`${BASE_URL}${test.url}`)
      
      const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus]
      
      if (expectedStatuses.includes(response.status)) {
        console.log(`✅ PASS - Status: ${response.status}`)
        passed++
      } else {
        console.log(`❌ FAIL - Expected: ${expectedStatuses.join(' or ')}, Got: ${response.status}`)
        failed++
      }
    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`Total Tests: ${tests.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Success Rate: ${Math.round((passed / tests.length) * 100)}%`)

  if (failed === 0) {
    console.log('\n🎉 All API tests passed! Server is responding correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the server logs for details.')
  }

  return { passed, failed, total: tests.length }
}

// Test database connectivity through API
async function testDatabase() {
  console.log('\n🗄️  Testing Database Connectivity')
  console.log('='.repeat(50))

  try {
    // Test if we can reach a database-dependent endpoint
    const response = await fetch(`${BASE_URL}/api/auth/session`)
    
    if (response.status < 500) {
      console.log('✅ Database connection appears to be working')
      return true
    } else {
      console.log('❌ Database connection issues detected')
      return false
    }
  } catch (error) {
    console.log('❌ Cannot test database connectivity:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Basic System Tests\n')
  
  // Test server connectivity
  try {
    const response = await fetch(BASE_URL)
    console.log('✅ Server is running and accessible')
  } catch (error) {
    console.log('❌ Server is not accessible:', error.message)
    return
  }

  // Run API tests
  const apiResults = await testAPI()
  
  // Test database
  await testDatabase()

  // Show demo accounts for manual testing
  console.log('\n👥 Demo Accounts for Manual Testing')
  console.log('='.repeat(50))
  console.log('Admin: admin@teachingcenter.com / demo123')
  console.log('Teacher: teacher@teachingcenter.com / demo123') 
  console.log('Parent: parent@teachingcenter.com / demo123')
  console.log('Student: student@teachingcenter.com / demo123')
  console.log('\nAccess the application at: http://localhost:3004')

  return apiResults
}

// Run tests when called directly
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error)
}

export { runTests }
