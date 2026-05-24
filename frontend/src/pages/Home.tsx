import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Category, Product, Language } from '../types'
import { getCategories, getProducts, createInquiry } from '../api'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const [categories, setCategories] = useState<Category[]>([])
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', message: '' })
  const [inquirySent, setInquirySent] = useState(false)
  const [showInquiry, setShowInquiry] = useState(false)

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data))
    getProducts({ active: true }).then((res) => {
      const withDiscount = res.data.filter((p: Product) => p.discount_price)
      setSaleProducts(withDiscount.slice(0, 4))
    })
  }, [])

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault()
    await createInquiry(inquiryForm)
    setInquirySent(true)
    setInquiryForm({ name: '', phone: '', message: '' })
  }

  const categoryIcons: Record<string, string> = {
    'splitter-blocks': '🧱',
    'concrete-rings': '⭕',
    'liquid-concrete': '🪣',
  }

  const stats = [
    { value: '14+', label: 'лет на рынке' },
    { value: '500+', label: 'клиентов' },
    { value: '1000+', label: 'реализованных проектов' },
    { value: '50+', label: 'видов продукции' },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80')" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-28 text-center">
          <div className="inline-block bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider">
            🏭 Завод в Алматы · Прямые цены
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-yellow-400">JBI Beton</span><br />
            Бетонные изделия<br />высшего качества
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Производим и доставляем бетонные блоки, кольца и раствор прямо с завода в Алматы. Без посредников.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalog"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-10 py-4 rounded-xl text-lg transition shadow-lg"
            >
              📦 {t('home.hero_cta')}
            </Link>
            <button
              onClick={() => setShowInquiry(true)}
              className="border-2 border-white hover:bg-white hover:text-gray-900 font-bold px-10 py-4 rounded-xl text-lg transition"
            >
              📞 {t('home.inquiry_btn')}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-yellow-400 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-black text-gray-900">{s.value}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('home.categories_title')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Весь ассортимент доступен к заказу с доставкой по Алматы и области</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const name = cat[`name_${lang}` as keyof Category] as string || cat.name_ru
              return (
                <Link
                  key={cat.id}
                  to={`/catalog?category_id=${cat.id}`}
                  className="group relative bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-40 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-7xl">
                    {categoryIcons[cat.slug] || '🏗️'}
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-yellow-600 transition mb-1">
                      {name}
                    </h3>
                    <span className="text-yellow-500 text-sm font-medium">
                      Смотреть товары →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Sale products */}
      {saleProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">🔥 Акции и скидки</h2>
                <p className="text-gray-500 mt-1">Успейте купить по сниженным ценам</p>
              </div>
              <Link to="/catalog" className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm">
                Все товары →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {saleProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('home.why_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🏭', title: 'Собственный завод', text: 'Производим сами — цены без наценок посредников' },
              { icon: '🚚', title: 'Доставка по Алматы', text: 'Собственный автопарк. Привезём в нужное место и время' },
              { icon: '✅', title: 'Гарантия качества', text: 'Соответствие ГОСТ. Продукция проходит лабораторный контроль' },
              { icon: '💰', title: 'Выгодные цены', text: 'Оптовые скидки для строительных компаний и ИП' },
            ].map((item) => (
              <div key={item.title} className="bg-gray-800 rounded-2xl p-6 text-center hover:bg-gray-750 transition">
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry CTA */}
      <section className="py-16 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('home.inquiry_title')}</h2>
          <p className="text-gray-800 mb-8 text-lg">{t('home.inquiry_subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowInquiry(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-10 py-4 rounded-xl text-lg transition shadow-lg"
            >
              📞 Заказать звонок
            </button>
            <Link
              to="/contact"
              className="bg-white hover:bg-gray-50 text-gray-900 font-bold px-10 py-4 rounded-xl text-lg transition shadow-lg"
            >
              📍 Наши контакты
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Отзывы клиентов</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Асан Бекжанов', role: 'Прораб, ТОО "СтройМастер"', text: 'Заказываем бетонные блоки уже 3 года. Качество стабильное, доставка всегда вовремя. Рекомендую!', stars: 5 },
              { name: 'Дмитрий Ковалёв', role: 'Частный застройщик', text: 'Строил дом — брал кольца для колодца и блоки для фундамента. Цены честные, без накруток.', stars: 5 },
              { name: 'Айгуль Нурланова', role: 'Менеджер ТОО "Алмас Курылыс"', text: 'Оперативно отвечают, быстро оформляют заказ. Бетон М300 отличного качества.', stars: 5 },
            ].map((review) => (
              <div key={review.name} className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex mb-3">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-4 italic">"{review.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{review.name}</div>
                  <div className="text-gray-500 text-xs">{review.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry popup */}
      {showInquiry && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{t('home.inquiry_title')}</h3>
              <button onClick={() => setShowInquiry(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            {inquirySent ? (
              <div className="bg-green-50 text-green-700 rounded-xl p-6 font-semibold text-center text-lg">
                ✅ {t('inquiry.success')}
              </div>
            ) : (
              <form onSubmit={handleInquiry} className="space-y-4">
                <input required type="text" placeholder={t('inquiry.name')}
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400" />
                <input required type="tel" placeholder={t('inquiry.phone')}
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400" />
                <textarea placeholder={t('inquiry.message')}
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400 resize-none" />
                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 rounded-lg transition">
                  {t('inquiry.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
