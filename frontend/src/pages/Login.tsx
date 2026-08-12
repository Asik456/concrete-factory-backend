import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login } from '../api'
import { useAuth } from '../store/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(form)
      authLogin(res.data.token, res.data.user)
      navigate('/')
    } catch (err: any) {
      const code = err?.response?.data?.error
      if (code === 'email_not_verified') {
        navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)
      } else if (code === 'account_blocked') {
        setError(t('auth.account_blocked'))
      } else if (err?.code === 'ERR_NETWORK') {
        setError(t('auth.server_unavailable'))
      } else {
        setError(t('auth.invalid_credentials'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏗️</div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.login_title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input
              required type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
              placeholder="example@mail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
            <input
              required type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-lg transition"
          >
            {loading ? t('common.loading') : t('auth.submit_login')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="text-yellow-600 font-semibold hover:text-yellow-700">
            {t('auth.go_register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
