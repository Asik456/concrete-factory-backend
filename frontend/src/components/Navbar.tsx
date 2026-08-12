import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🏗️</span>
            <span className="font-bold text-lg text-yellow-400">JBI Beton</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-yellow-400 transition text-sm">{t('nav.home')}</Link>
            <Link to="/catalog" className="hover:text-yellow-400 transition text-sm">{t('nav.catalog')}</Link>
            <Link to="/about" className="hover:text-yellow-400 transition text-sm">{t('nav.about')}</Link>
            <Link to="/contact" className="hover:text-yellow-400 transition text-sm">{t('nav.contact')}</Link>
            {isAdmin && (
              <Link to="/admin/products" className="hover:text-yellow-400 transition text-sm text-yellow-300">{t('nav.admin')}</Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 hidden sm:block">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm hover:text-yellow-400 transition"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-yellow-400 text-gray-900 hover:bg-yellow-300 px-3 py-1.5 rounded font-semibold transition"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
