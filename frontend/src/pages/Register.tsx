import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { register, login } from '../api'
import { useAuth } from '../store/AuthContext'

export default function Register() {
  const { t } = useTranslation()
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register(form)
      const loginRes = await login({ email: form.email, password: form.password })
      authLogin(loginRes.data.token, loginRes.data.user)
      navigate('/')
    } catch (err: any) {
      const msg = err?.response?.data?.error
      if (msg?.toLowerCase().includes('email')) {
        setError('Этот email уже зарегистрирован. Попробуйте войти.')
      } else if (err?.code === 'ERR_NETWORK') {
        setError('Сервер недоступен. Убедитесь что docker-compose up запущен.')
      } else {
        setError(msg || 'Ошибка регистрации. Попробуйте ещё раз.')
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
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.register_title')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.name')}</label>
            <input
              required type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
              placeholder="+7 700 000 00 00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input
              required type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
            <input
              required type="password" minLength={6}
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
            {loading ? t('common.loading') : t('auth.submit_register')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('auth.have_account')}{' '}
          <Link to="/login" className="text-yellow-600 font-semibold hover:text-yellow-700">
            {t('auth.go_login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
