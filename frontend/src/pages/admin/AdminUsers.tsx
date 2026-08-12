import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User } from '../../types'
import { getAllUsers, updateUserRole, updateUserBlock } from '../../api'
import { useAuth } from '../../store/AuthContext'

type RoleFilter = 'all' | 'customer' | 'admin'
type StatusFilter = 'all' | 'active' | 'blocked'
type SortOption = 'date_desc' | 'date_asc' | 'name_asc'

export default function AdminUsers() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortOption>('date_desc')

  const load = () => getAllUsers().then((r) => setUsers(r.data))
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = [...users]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((u) =>
        u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
      )
    }

    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter)
    }

    if (statusFilter !== 'all') {
      result = result.filter((u) => (statusFilter === 'blocked' ? u.is_blocked : !u.is_blocked))
    }

    if (sort === 'name_asc') result.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'date_asc') result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
    if (sort === 'date_desc') result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    return result
  }, [users, search, roleFilter, statusFilter, sort])

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

      {/* Search / filter / sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.search_users_placeholder')}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        >
          <option value="all">{t('admin.filter_all_roles')}</option>
          <option value="customer">{t('admin.role_customer')}</option>
          <option value="admin">{t('admin.role_admin')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        >
          <option value="all">{t('admin.filter_all_status')}</option>
          <option value="active">{t('admin.active_status')}</option>
          <option value="blocked">{t('admin.blocked')}</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        >
          <option value="date_desc">{t('admin.sort_date_desc')}</option>
          <option value="date_asc">{t('admin.sort_date_asc')}</option>
          <option value="name_asc">{t('admin.sort_name')}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-gray-500 text-center py-20">{t('admin.no_users')}</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
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
              {filtered.map((u) => {
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
