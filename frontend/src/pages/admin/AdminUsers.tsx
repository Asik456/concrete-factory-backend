import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User } from '../../types'
import { getAllUsers, updateUserRole, updateUserBlock } from '../../api'
import { useAuth } from '../../store/AuthContext'

export default function AdminUsers() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])

  const load = () => getAllUsers().then((r) => setUsers(r.data))
  useEffect(() => { load() }, [])

  const handleRoleChange = async (id: number, role: string) => {
    await updateUserRole(id, role)
    load()
  }

  const handleToggleBlock = async (u: User) => {
    if (!u.is_blocked && !confirm(t('admin.confirm_block'))) return
    await updateUserBlock(u.id, !u.is_blocked)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.users')}</h1>

      {users.length === 0 ? (
        <div className="text-gray-500 text-center py-20">{t('admin.no_users')}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">{t('auth.name')}</th>
                <th className="text-left px-4 py-3">{t('auth.email')}</th>
                <th className="text-left px-4 py-3">{t('auth.phone')}</th>
                <th className="text-left px-4 py-3">{t('admin.role')}</th>
                <th className="text-left px-4 py-3">{t('admin.registered_at')}</th>
                <th className="text-left px-4 py-3">{t('admin.verification')}</th>
                <th className="text-right px-4 py-3">{t('admin.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:border-yellow-400 disabled:opacity-50"
                      >
                        <option value="customer">{t('admin.role_customer')}</option>
                        <option value="admin">{t('admin.role_admin')}</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        u.is_verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.is_verified ? t('admin.verified') : t('admin.not_verified')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold mr-3 ${
                        u.is_blocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {u.is_blocked ? t('admin.blocked') : t('admin.active_status')}
                      </span>
                      {!isSelf && (
                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={u.is_blocked ? 'text-green-600 hover:text-green-700' : 'text-red-500 hover:text-red-700'}
                        >
                          {u.is_blocked ? t('admin.unblock') : t('admin.block')}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
