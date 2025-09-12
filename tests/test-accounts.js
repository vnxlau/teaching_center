#!/usr/bin/env node

/**
 * Teaching Center Management System - User Account Testing Script
 * 
 * This script validates all user accounts and their respective dashboards
 * to ensure proper functionality across all user roles.
 */

const { chromium } = require('playwright')

const BASE_URL = 'http://localhost:3004'

// Test accounts from the database seed
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@teachingcenter.com',
    password: 'demo123',
    role: 'ADMIN',
    expectedDashboard: '/admin/dashboard',
    testName: 'Admin Account'
  },
  teacher: {
    email: 'teacher@teachingcenter.com',
    password: 'demo123',
    role: 'STAFF',
    expectedDashboard: '/admin/dashboard',
    testName: 'Teacher Account'
  },
  parent: {
    email: 'parent@teachingcenter.com',
    password: 'demo123',
    role: 'PARENT',
    expectedDashboard: '/parent/dashboard',
    testName: 'Parent Account'
  },
  student: {
    email: 'student@teachingcenter.com',
    password: 'demo123',
    role: 'STUDENT',
    expectedDashboard: '/student/dashboard',
    testName: 'Student Account'
  }
}

class TestResults {
  constructor() {
    this.results = []
    this.passed = 0
    this.failed = 0
  }

  addResult(test, status, message, screenshot = null) {
    this.results.push({
      test,
      status,
      message,
      screenshot,
      timestamp: new Date().toISOString()
    })
    
    if (status === 'PASS') {
      this.passed++
      console.log(`✅ ${test}: ${message}`)
    } else {
      this.failed++
      console.log(`❌ ${test}: ${message}`)
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('TEACHING CENTER TEST RESULTS SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`Passed: ${this.passed}`)
    console.log(`Failed: ${this.failed}`)
    console.log(`Success Rate: ${Math.round((this.passed / this.results.length) * 100)}%`)
    console.log('='.repeat(60))

    if (this.failed > 0) {
      console.log('\nFAILED TESTS:')
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`- ${r.test}: ${r.message}`))
    }

    return {
      total: this.results.length,
      passed: this.passed,
      failed: this.failed,
      successRate: Math.round((this.passed / this.results.length) * 100),
      details: this.results
    }
  }
}

async function testUserAccount(browser, account, results) {
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log(`\nTesting ${account.testName}...`)

    // Navigate to sign in page
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.waitForLoadState('networkidle')

    // Check if signin page loads
    const signinTitle = await page.locator('h1, h2').first().textContent()
    if (signinTitle && signinTitle.toLowerCase().includes('sign')) {
      results.addResult(`${account.testName} - Signin Page`, 'PASS', 'Signin page loaded successfully')
    } else {
      results.addResult(`${account.testName} - Signin Page`, 'FAIL', 'Signin page did not load properly')
      return
    }

    // Fill in credentials
    await page.fill('input[type="email"], input[name="email"]', account.email)
    await page.fill('input[type="password"], input[name="password"]', account.password)

    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign In")')
    
    // Wait for navigation
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Check if redirected to correct dashboard
    const currentUrl = page.url()
    if (currentUrl.includes(account.expectedDashboard)) {
      results.addResult(`${account.testName} - Login & Redirect`, 'PASS', `Successfully logged in and redirected to ${account.expectedDashboard}`)
    } else {
      results.addResult(`${account.testName} - Login & Redirect`, 'FAIL', `Expected ${account.expectedDashboard}, got ${currentUrl}`)
      return
    }

    // Test dashboard loading
    const dashboardContent = await page.locator('main, .main-content, [role="main"]').count()
    if (dashboardContent > 0) {
      results.addResult(`${account.testName} - Dashboard Loading`, 'PASS', 'Dashboard content loaded successfully')
    } else {
      results.addResult(`${account.testName} - Dashboard Loading`, 'FAIL', 'Dashboard content did not load')
    }

    // Test user info display
    const userInfo = await page.locator('text=' + account.email.split('@')[0]).count() > 0 ||
                     await page.locator('[data-testid="user-info"], .user-info').count() > 0
    if (userInfo) {
      results.addResult(`${account.testName} - User Info`, 'PASS', 'User information displayed correctly')
    } else {
      results.addResult(`${account.testName} - User Info`, 'WARN', 'User information not clearly visible')
    }

    // Test logout functionality
    const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")')
    if (await logoutButton.count() > 0) {
      await logoutButton.click()
      await page.waitForLoadState('networkidle', { timeout: 5000 })
      
      const afterLogoutUrl = page.url()
      if (afterLogoutUrl.includes('/auth/signin') || afterLogoutUrl === `${BASE_URL}/`) {
        results.addResult(`${account.testName} - Logout`, 'PASS', 'Logout functionality works correctly')
      } else {
        results.addResult(`${account.testName} - Logout`, 'FAIL', 'Logout did not redirect properly')
      }
    } else {
      results.addResult(`${account.testName} - Logout`, 'FAIL', 'Logout button not found')
    }

  } catch (error) {
    results.addResult(`${account.testName} - General`, 'FAIL', `Test failed with error: ${error.message}`)
  } finally {
    await context.close()
  }
}

async function testHomePage(browser, results) {
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('\nTesting Home Page...')

    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')

    // Check if home page loads
    const title = await page.title()
    if (title && title.toLowerCase().includes('teaching')) {
      results.addResult('Home Page - Loading', 'PASS', 'Home page loaded successfully')
    } else {
      results.addResult('Home Page - Loading', 'FAIL', 'Home page did not load properly')
    }

    // Check for sign in link
    const signinLink = await page.locator('a:has-text("Sign In"), a[href*="signin"]').count()
    if (signinLink > 0) {
      results.addResult('Home Page - Navigation', 'PASS', 'Sign in link is available')
    } else {
      results.addResult('Home Page - Navigation', 'FAIL', 'Sign in link not found')
    }

  } catch (error) {
    results.addResult('Home Page - General', 'FAIL', `Home page test failed: ${error.message}`)
  } finally {
    await context.close()
  }
}

async function testAPIEndpoints(results) {
  console.log('\nTesting API Endpoints...')

  const endpoints = [
    '/api/auth/session',
    '/api/admin/stats',
    '/api/student/dashboard',
    '/api/parent/dashboard'
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`)
      
      if (response.status === 401 || response.status === 403) {
        // Expected for protected endpoints without auth
        results.addResult(`API - ${endpoint}`, 'PASS', 'Endpoint properly protected')
      } else if (response.status < 500) {
        results.addResult(`API - ${endpoint}`, 'PASS', `Endpoint responding (status: ${response.status})`)
      } else {
        results.addResult(`API - ${endpoint}`, 'FAIL', `Server error (status: ${response.status})`)
      }
    } catch (error) {
      results.addResult(`API - ${endpoint}`, 'FAIL', `Connection failed: ${error.message}`)
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Teaching Center Management System Tests')
  console.log('=' .repeat(60))

  const results = new TestResults()
  
  // Check if server is running
  try {
    const response = await fetch(BASE_URL)
    if (!response.ok) {
      console.log('❌ Server is not running or not accessible')
      return
    }
    console.log('✅ Server is running and accessible')
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message)
    return
  }

  const browser = await chromium.launch({ headless: true })

  try {
    // Test home page
    await testHomePage(browser, results)

    // Test API endpoints
    await testAPIEndpoints(results)

    // Test all user accounts
    for (const [key, account] of Object.entries(TEST_ACCOUNTS)) {
      await testUserAccount(browser, account, results)
    }

  } finally {
    await browser.close()
  }

  // Generate final report
  const report = results.generateReport()
  
  // Save detailed report
  const fs = require('fs')
  const reportPath = './test-results.json'
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nDetailed report saved to: ${reportPath}`)

  return report
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { runAllTests, TEST_ACCOUNTS }
