import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('about.hero_title')} <span className="text-yellow-400">JSI Beton</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('about.hero_subtitle')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.mission_title')}</h2>
          <p className="text-gray-600 mb-4 leading-relaxed">
            {t('about.mission_text')}
          </p>
          <p className="text-gray-600 mb-4 leading-relaxed">
            {t('about.mission_text_2')}
          </p>
          <div className="flex gap-4 mt-6">
            <Link
              to="/catalog"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition"
            >
              {t('about.view_catalog')}
            </Link>
            <Link
              to="/contact"
              className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-6 py-3 rounded-xl transition"
            >
              {t('about.contact_us')}
            </Link>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{t('about.history_title')}</h2>
          <p className="text-gray-300 leading-relaxed mb-8">
            {t('about.history_text')}
          </p>
          <div className="inline-block bg-gray-800 rounded-xl px-6 py-4">
            <div className="text-yellow-400 text-xs uppercase tracking-wider font-semibold mb-1">
              {t('about.director_label')}
            </div>
            <div className="font-semibold">{t('about.director_name')}</div>
          </div>
        </div>
      </section>

      {/* Product lines */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{t('about.products_title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { icon: '⭕', key: 'about.product_rings' },
              { icon: '▬', key: 'about.product_cover_plates' },
              { icon: '⬛', key: 'about.product_bottom_plates' },
              { icon: '🧱', key: 'about.product_blocks' },
              { icon: '🚛', key: 'about.product_concrete' },
            ].map((item) => (
              <div key={item.key} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{t(item.key)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-yellow-400">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.cta_title')}</h2>
          <p className="text-gray-800 mb-8">{t('about.cta_subtitle')}</p>
          <Link
            to="/contact"
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-10 py-4 rounded-xl text-lg transition"
          >
            {t('about.contact_us')}
          </Link>
        </div>
      </section>
    </div>
  )
}
