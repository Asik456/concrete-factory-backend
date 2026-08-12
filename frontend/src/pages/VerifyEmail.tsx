import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { verifyEmail, resendVerificationCode } from '../api'
import { useAuth } from '../store/AuthContext'

export default function VerifyEmail() {
  const { t } = useTranslation()
  const { login: authLogin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResent(false)
    try {
      const res = await verifyEmail({ email, code })
      authLogin(res.data.token, res.data.user)
      navigate('/')
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
      await resendVerificationCode(email)
      setResent(true)
    } catch {
      setError(t('verify.error'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📧</div>
          <h1 className="text-2xl font-bold text-gray-900">{t('verify.title')}</h1>
          <p className="text-sm text-gray-600 mt-2">{t('verify.subtitle')}</p>
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

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {resent && <p className="text-green-600 text-sm">{t('verify.resent')}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-lg transition"
          >
            {loading ? t('common.loading') : t('verify.submit')}
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
