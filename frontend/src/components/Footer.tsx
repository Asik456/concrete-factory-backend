import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-yellow-400 font-bold text-lg mb-3">🏗️ JBI Beton</div>
            <p className="text-sm">Производство бетонных изделий в Алматы с 2010 года.</p>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Навигация</div>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalog" className="hover:text-yellow-400 transition">{t('nav.catalog')}</Link></li>
              <li><Link to="/about" className="hover:text-yellow-400 transition">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-yellow-400 transition">{t('nav.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Контакты</div>
            <p className="text-sm">📞 +7 (727) 000-00-00</p>
            <p className="text-sm">📧 info@jbibeton.kz</p>
            <p className="text-sm">📍 Алматы, ул. Промышленная, 15</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
          © 2024 JBI Beton. Алматы. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
