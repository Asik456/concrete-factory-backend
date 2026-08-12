import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resetPassword, forgotPassword } from '../api'

export default function ResetPassword() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResent(false)

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwords_dont_match'))
      return
    }

    setLoading(true)
    try {
      await resetPassword({ email, code, new_password: newPassword })
      setDone(true)
    } catch (err: any) {
      const msg = err?.response?.data?.error
      if (msg === 'Code expired') {
        setError(t('verify.code_expired'))
      } else if (msg === 'Invalid code') {
        setError(t('verify.invalid_code'))
      } else {
        setError(t('verify.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setResent(false)
    try {
      await forgotPassword(email)
      setResent(true)
    } catch {
      setError(t('verify.error'))
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('auth.password_reset_done_title')}</h1>
          <p className="text-sm text-gray-600 mb-6">{t('auth.password_reset_done_subtitle')}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 rounded-lg transition"
          >
            {t('auth.go_login')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/images/logo.jpg" alt="JSI Beton" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.reset_password_title')}</h1>
          <p className="text-sm text-gray-600 mt-2">{t('auth.reset_password_subtitle')}</p>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('verify.code')}</label>
            <input
              required type="text" inputMode="numeric" maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400 text-center text-2xl tracking-[0.5em]"
              placeholder="000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.new_password')}</label>
            <input
              required type="password" minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.confirm_password')}</label>
            <input
              required type="password" minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {resent && <p className="text-green-600 text-sm">{t('verify.resent')}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-lg transition"
          >
            {loading ? t('common.loading') : t('auth.set_new_password')}
          </button>
        </form>

        <button
          onClick={handleResend}
          className="w-full text-center text-sm text-yellow-600 hover:text-yellow-700 mt-4"
        >
          {t('verify.resend')}
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          <Link to="/login" className="text-yellow-600 font-semibold hover:text-yellow-700">
            {t('auth.go_login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
