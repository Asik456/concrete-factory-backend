import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center p-20">{t('common.loading')}</div>
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
