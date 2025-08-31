import { prisma } from '@/lib/prisma'

// Cache for system settings to avoid frequent DB queries
let settingsCache: Record<string, string> = {}
let cacheExpiry = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Default system settings
const defaultSettings = {
  school_name: 'Teaching Center Excellence',
  school_address: '123 Education Street, Learning City, LC 12345',
  school_phone: '+351 123 456 789',
  school_email: 'info@teachingcenter.com',
  academic_year: '2024-2025',
  currency: 'EUR',
  timezone: 'Europe/Lisbon'
}

/**
 * Get all system settings with caching
 */
export async function getSystemSettings(): Promise<Record<string, string>> {
  const now = Date.now()
  
  // Return cached settings if still valid
  if (cacheExpiry > now && Object.keys(settingsCache).length > 0) {
    return settingsCache
  }

  try {
    // Try to get settings from database first using Prisma
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: Object.keys(defaultSettings)
        }
      },
      select: {
        key: true,
        value: true
      }
    })

    // Convert to object format
    const settingsObject: Record<string, string> = { ...defaultSettings }
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value
    })

    // Update cache
    settingsCache = settingsObject
    cacheExpiry = now + CACHE_DURATION

    return settingsObject
  } catch (error) {
    console.error('Failed to fetch system settings from database:', error)
    // Return defaults if database fails
    return defaultSettings
  }
}

/**
 * Get a specific system setting
 */
export async function getSystemSetting(key: string): Promise<string> {
  const settings = await getSystemSettings()
  return settings[key] || defaultSettings[key as keyof typeof defaultSettings] || ''
}

/**
 * Update system settings and clear cache
 */
export async function updateSystemSettings(updates: Record<string, string>): Promise<void> {
  try {
    for (const [key, value] of Object.entries(updates)) {
      await prisma.systemSettings.upsert({
        where: { key },
        update: { 
          value,
          updatedAt: new Date()
        },
        create: {
          key,
          value,
          category: 'general',
          dataType: 'string',
          description: getSettingDescription(key)
        }
      })
    }
    
    // Clear cache to force reload
    settingsCache = {}
    cacheExpiry = 0
    
    // Dispatch event to notify components that settings have been updated
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { 
        detail: updates 
      }))
    }
  } catch (error) {
    console.error('Failed to update system settings:', error)
    throw error
  }
}

/**
 * Clear the settings cache (useful after updates)
 */
export function clearSettingsCache(): void {
  settingsCache = {}
  cacheExpiry = 0
}

/**
 * Get human-readable descriptions for settings
 */
function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    school_name: 'Name of the educational institution',
    school_address: 'Physical address of the school',
    school_phone: 'Main contact phone number',
    school_email: 'Main contact email address',
    academic_year: 'Current academic year period',
    currency: 'Default currency for financial operations',
    timezone: 'Default timezone for the institution'
  }
  return descriptions[key] || `System setting: ${key}`
}

/**
 * Convert camelCase to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

/**
 * Convert snake_case to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Get school name specifically (commonly used)
 */
export async function getSchoolName(): Promise<string> {
  return await getSystemSetting('school_name')
}
