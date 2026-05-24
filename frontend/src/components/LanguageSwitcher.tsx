import { useTranslation } from 'react-i18next'

const langs = [
  { code: 'ru', label: 'РУС' },
  { code: 'kz', label: 'ҚАЗ' },
  { code: 'en', label: 'ENG' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const change = (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('lang', code)
  }

  return (
    <div className="flex gap-1">
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => change(l.code)}
          className={`px-2 py-1 text-xs font-semibold rounded transition ${
            i18n.language === l.code
              ? 'bg-yellow-400 text-gray-900'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
