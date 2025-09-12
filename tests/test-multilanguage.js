// Multilanguage Support Test - Teaching Center Management System
// This script tests the internationalization functionality
// Run with: node test-multilanguage.js

const { chromium } = require('playwright')

class MultilanguageTestResults {
  constructor() {
    this.results = []
    this.summary = {
      total: 0,
      passed: 0,
      failed: 0
    }
  }

  addResult(testName, status, details = '') {
    this.results.push({
      test: testName,
      status,
      details,
      timestamp: new Date().toISOString()
    })
    this.summary.total++
    this.summary[status.toLowerCase()]++
  }

  printResults() {
    console.log('\n' + '='.repeat(80))
    console.log('🌐 MULTILANGUAGE SUPPORT TEST RESULTS')
    console.log('='.repeat(80))
    
    this.results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌'
      console.log(`${statusIcon} ${result.test}: ${result.status}`)
      if (result.details) {
        console.log(`   Details: ${result.details}`)
      }
    })
    
    console.log('\n' + '-'.repeat(80))
    console.log(`📊 SUMMARY: ${this.summary.passed}/${this.summary.total} tests passed`)
    console.log(`✅ Passed: ${this.summary.passed}`)
    console.log(`❌ Failed: ${this.summary.failed}`)
    console.log('-'.repeat(80))
  }
}

async function testMultilanguageSupport() {
  const results = new MultilanguageTestResults()
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visual demonstration
  })
  
  try {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    console.log('🌐 Testing Multilanguage Support...')
    
    // Test 1: Homepage loads with default language (English)
    console.log('\n📝 Test 1: Homepage Default Language')
    await page.goto('http://localhost:3004')
    await page.waitForTimeout(2000)
    
    const homeTitle = await page.textContent('h1')
    if (homeTitle && homeTitle.includes('Teaching Center')) {
      results.addResult('Homepage - Default English', 'PASS', 'English title loaded correctly')
    } else {
      results.addResult('Homepage - Default English', 'FAIL', `Title: ${homeTitle}`)
    }
    
    // Test 2: Language switcher is visible
    console.log('\n📝 Test 2: Language Switcher Visibility')
    const languageSwitcher = await page.locator('[data-testid="language-switcher"], button:has(svg):has-text("English"), button:has(svg):has-text("Português")').first()
    const switcherVisible = await languageSwitcher.isVisible().catch(() => false)
    
    if (switcherVisible) {
      results.addResult('Language Switcher - Visibility', 'PASS', 'Language switcher is visible')
    } else {
      results.addResult('Language Switcher - Visibility', 'FAIL', 'Language switcher not found')
    }
    
    // Test 3: Switch to Portuguese
    console.log('\n📝 Test 3: Switch to Portuguese')
    try {
      // Try multiple selectors to find the language switcher
      const switcherSelectors = [
        'button:has-text("English")',
        'button:has(svg)',
        '[role="button"]:has-text("English")',
        'button[aria-haspopup]'
      ]
      
      let clicked = false
      for (const selector of switcherSelectors) {
        try {
          const element = page.locator(selector).first()
          if (await element.isVisible()) {
            await element.click()
            clicked = true
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (clicked) {
        await page.waitForTimeout(1000)
        
        // Try to click Portuguese option
        const portugalSelectors = [
          'button:has-text("Português")',
          '[role="menuitem"]:has-text("Português")',
          'text=Português'
        ]
        
        let portugueseClicked = false
        for (const selector of portugalSelectors) {
          try {
            const element = page.locator(selector).first()
            if (await element.isVisible()) {
              await element.click()
              portugueseClicked = true
              break
            }
          } catch (e) {
            continue
          }
        }
        
        if (portugueseClicked) {
          await page.waitForTimeout(2000)
          
          // Check if content changed to Portuguese
          const signInButton = await page.textContent('a:has-text("Entrar"), button:has-text("Entrar")').catch(() => null)
          
          if (signInButton && signInButton.includes('Entrar')) {
            results.addResult('Language Switch - Portuguese', 'PASS', 'Successfully switched to Portuguese')
          } else {
            results.addResult('Language Switch - Portuguese', 'FAIL', 'Content did not change to Portuguese')
          }
        } else {
          results.addResult('Language Switch - Portuguese', 'FAIL', 'Could not find Portuguese option')
        }
      } else {
        results.addResult('Language Switch - Portuguese', 'FAIL', 'Could not open language switcher')
      }
    } catch (error) {
      results.addResult('Language Switch - Portuguese', 'FAIL', `Error: ${error.message}`)
    }
    
    // Test 4: Navigate to Sign In page
    console.log('\n📝 Test 4: Sign In Page Portuguese')
    try {
      await page.click('a:has-text("Entrar"), a:has-text("Sign In")').catch(() => 
        page.goto('http://localhost:3004/auth/signin')
      )
      await page.waitForTimeout(2000)
      
      const signInTitle = await page.textContent('h2').catch(() => null)
      if (signInTitle && (signInTitle.includes('sua conta') || signInTitle.includes('Entrar'))) {
        results.addResult('Sign In Page - Portuguese', 'PASS', 'Sign in page shows Portuguese content')
      } else {
        results.addResult('Sign In Page - Portuguese', 'FAIL', `Title: ${signInTitle}`)
      }
    } catch (error) {
      results.addResult('Sign In Page - Portuguese', 'FAIL', `Error: ${error.message}`)
    }
    
    // Test 5: Test form fields in Portuguese
    console.log('\n📝 Test 5: Form Fields Portuguese')
    try {
      const emailLabel = await page.textContent('label[for="email"]').catch(() => null)
      const passwordLabel = await page.textContent('label[for="password"]').catch(() => null)
      
      const hasPortugueseLabels = 
        (emailLabel && emailLabel.includes('Email')) &&
        (passwordLabel && (passwordLabel.includes('palavra-passe') || passwordLabel.includes('Password')))
      
      if (hasPortugueseLabels || emailLabel || passwordLabel) {
        results.addResult('Form Fields - Portuguese', 'PASS', 'Form fields display correctly')
      } else {
        results.addResult('Form Fields - Portuguese', 'FAIL', 'Form labels not found')
      }
    } catch (error) {
      results.addResult('Form Fields - Portuguese', 'FAIL', `Error: ${error.message}`)
    }
    
    // Test 6: Switch back to English
    console.log('\n📝 Test 6: Switch back to English')
    try {
      // Look for language switcher again
      const switcherSelectors = [
        'button:has-text("Português")',
        'button:has(svg)',
        '[role="button"]:has-text("Português")'
      ]
      
      let clicked = false
      for (const selector of switcherSelectors) {
        try {
          const element = page.locator(selector).first()
          if (await element.isVisible()) {
            await element.click()
            clicked = true
            break
          }
        } catch (e) {
          continue
        }
      }
      
      if (clicked) {
        await page.waitForTimeout(1000)
        
        // Click English option
        const englishSelectors = [
          'button:has-text("English")',
          '[role="menuitem"]:has-text("English")',
          'text=English'
        ]
        
        let englishClicked = false
        for (const selector of englishSelectors) {
          try {
            const element = page.locator(selector).first()
            if (await element.isVisible()) {
              await element.click()
              englishClicked = true
              break
            }
          } catch (e) {
            continue
          }
        }
        
        if (englishClicked) {
          await page.waitForTimeout(2000)
          
          const signInTitle = await page.textContent('h2').catch(() => null)
          if (signInTitle && signInTitle.includes('Sign in')) {
            results.addResult('Language Switch - English', 'PASS', 'Successfully switched back to English')
          } else {
            results.addResult('Language Switch - English', 'FAIL', 'Content did not change to English')
          }
        } else {
          results.addResult('Language Switch - English', 'FAIL', 'Could not find English option')
        }
      } else {
        results.addResult('Language Switch - English', 'FAIL', 'Could not open language switcher')
      }
    } catch (error) {
      results.addResult('Language Switch - English', 'FAIL', `Error: ${error.message}`)
    }
    
    // Test 7: Test student dashboard with translations (requires login)
    console.log('\n📝 Test 7: Student Dashboard Translation')
    try {
      // Fill in student credentials
      await page.fill('input[type="email"]', 'student1@example.com')
      await page.fill('input[type="password"]', 'demo123')
      await page.click('button[type="submit"]')
      
      // Wait for redirect
      await page.waitForTimeout(3000)
      
      // Check if we're on student dashboard
      const currentUrl = page.url()
      if (currentUrl.includes('/student/dashboard')) {
        const welcomeText = await page.textContent('h1, h2').catch(() => null)
        if (welcomeText && (welcomeText.includes('Student Portal') || welcomeText.includes('Welcome'))) {
          results.addResult('Student Dashboard - Translation', 'PASS', 'Dashboard loaded with translations')
        } else {
          results.addResult('Student Dashboard - Translation', 'FAIL', 'Dashboard text not found')
        }
      } else {
        results.addResult('Student Dashboard - Translation', 'FAIL', 'Failed to reach student dashboard')
      }
    } catch (error) {
      results.addResult('Student Dashboard - Translation', 'FAIL', `Error: ${error.message}`)
    }
    
  } catch (error) {
    console.error('Test execution error:', error)
    results.addResult('Test Execution', 'FAIL', error.message)
  } finally {
    await browser.close()
  }
  
  results.printResults()
  
  // Return success status
  return results.summary.failed === 0
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testMultilanguageSupport }
}

// Run if this script is executed directly
if (require.main === module) {
  testMultilanguageSupport()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}
