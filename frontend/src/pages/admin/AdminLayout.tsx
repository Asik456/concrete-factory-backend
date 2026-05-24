import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const links = [
  { to: '/admin/products', icon: '📦', key: 'admin.products' },
  { to: '/admin/categories', icon: '📂', key: 'admin.categories' },
  { to: '/admin/orders', icon: '🛒', key: 'admin.orders' },
  { to: '/admin/inquiries', icon: '📞', key: 'admin.inquiries' },
]

export default function AdminLayout() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <div className="text-yellow-400 font-bold text-lg">🏗️ Admin</div>
          <div className="text-gray-400 text-xs mt-1">{t('admin.dashboard')}</div>
        </div>
        <nav className="p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                  isActive ? 'bg-yellow-400 text-gray-900 font-semibold' : 'text-gray-300 hover:bg-gray-800'
                }`
              }
            >
              <span>{link.icon}</span>
              {t(link.key)}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
