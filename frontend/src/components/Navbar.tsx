import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const closeMenu = () => setMenuOpen(false)

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/catalog', label: t('nav.catalog') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ]

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <img src="/images/logo.jpg" alt="JSI Beton" className="w-9 h-9 rounded-full object-cover" />
            <span className="font-bold text-lg text-yellow-400">JSI Beton</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-yellow-400 transition text-sm">
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin/products" className="hover:text-yellow-400 transition text-sm text-yellow-300">{t('nav.admin')}</Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
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
                <Link to="/login" className="text-sm hover:text-yellow-400 transition">
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

          {/* Mobile: language switcher + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="p-2 -mr-2 text-white"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-800 pt-3">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="px-2 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm"
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/products"
                  onClick={closeMenu}
                  className="px-2 py-2.5 rounded-lg hover:bg-gray-800 transition text-sm text-yellow-300"
                >
                  {t('nav.admin')}
                </Link>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800">
              {user ? (
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-gray-300">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex-1 text-center text-sm border border-gray-700 py-2 rounded-lg hover:bg-gray-800 transition"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="flex-1 text-center text-sm bg-yellow-400 text-gray-900 hover:bg-yellow-300 py-2 rounded-lg font-semibold transition"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
