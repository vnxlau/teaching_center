import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {t.language}
      </label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'pt')}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
    </div>
  )
}
