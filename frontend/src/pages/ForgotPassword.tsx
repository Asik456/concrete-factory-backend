import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { forgotPassword } from '../api'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      navigate(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch {
      setError(t('auth.server_unavailable'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/logo.jpg" alt="JSI Beton" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.forgot_password_title')}</h1>
          <p className="text-sm text-gray-600 mt-2">{t('auth.forgot_password_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input
              required type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-lg transition"
          >
            {loading ? t('common.loading') : t('auth.send_reset_code')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          <Link to="/login" className="text-yellow-600 font-semibold hover:text-yellow-700">
            {t('auth.go_login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
