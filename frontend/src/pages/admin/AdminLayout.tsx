import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { getInquiries } from '../../api'
import { Inquiry } from '../../types'

const links = [
  { to: '/admin/products', icon: '📦', key: 'admin.products' },
  { to: '/admin/categories', icon: '📂', key: 'admin.categories' },
  { to: '/admin/users', icon: '👤', key: 'admin.users' },
  { to: '/admin/inquiries', icon: '📞', key: 'admin.inquiries' },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const [unreadInquiries, setUnreadInquiries] = useState(0)

  useEffect(() => {
    getInquiries()
      .then((r) => setUnreadInquiries(r.data.filter((i: Inquiry) => !i.is_read).length))
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 bg-gray-50">
        <aside className="md:w-56 bg-gray-900 text-white flex-shrink-0">
          <div className="hidden md:block p-5 border-b border-gray-700">
            <div className="text-yellow-400 font-bold text-lg">🏗️ Admin</div>
            <div className="text-gray-400 text-xs mt-1">{t('admin.dashboard')}</div>
          </div>
          <nav className="flex md:flex-col gap-1 p-3 overflow-x-auto md:overflow-visible">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-lg text-sm transition whitespace-nowrap flex-shrink-0 ${
                    isActive ? 'bg-yellow-400 text-gray-900 font-semibold' : 'text-gray-300 hover:bg-gray-800'
                  }`
                }
              >
                <span>{link.icon}</span>
                {t(link.key)}
                {link.to === '/admin/inquiries' && unreadInquiries > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unreadInquiries}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
