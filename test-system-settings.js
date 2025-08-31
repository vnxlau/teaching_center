import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSystemSettings() {
  try {
    console.log('Testing database connection...')
    
    // Check if system settings exist
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ['school_name', 'school_address', 'school_phone', 'school_email']
        }
      }
    })
    
    console.log('System settings found:', settings.length)
    settings.forEach(setting => {
      console.log(`${setting.key}: ${setting.value}`)
    })
    
    // If no settings found, create them
    if (settings.length === 0) {
      console.log('No system settings found, creating default ones...')
      
      const defaultSettings = [
        { key: 'school_name', value: 'Teaching Center Excellence', description: 'Name of the educational institution', category: 'general' },
        { key: 'school_address', value: '123 Education Street, Learning City, LC 12345', description: 'Physical address of the school', category: 'general' },
        { key: 'school_phone', value: '+351 123 456 789', description: 'Main contact phone number', category: 'general' },
        { key: 'school_email', value: 'info@teachingcenter.com', description: 'Main contact email address', category: 'general' },
        { key: 'academic_year', value: '2024-2025', description: 'Current academic year period', category: 'academic' },
        { key: 'currency', value: 'EUR', description: 'Default currency for financial operations', category: 'financial' },
        { key: 'timezone', value: 'Europe/Lisbon', description: 'Default timezone for the institution', category: 'general' }
      ]
      
      for (const setting of defaultSettings) {
        await prisma.systemSettings.create({
          data: setting
        })
      }
      
      console.log('Default system settings created successfully!')
    }
    
  } catch (error) {
    console.error('Error testing system settings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSystemSettings()
