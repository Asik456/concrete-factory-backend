import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center p-20">Загрузка...</div>
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}
