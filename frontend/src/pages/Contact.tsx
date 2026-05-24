import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createInquiry } from '../api'

export default function Contact() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createInquiry(form)
      setSent(true)
      setForm({ name: '', phone: '', message: '' })
    } finally {
      setLoading(false)
    }
  }

  const contacts = [
    { icon: '📞', label: 'Телефон', value: '+7 (727) 000-00-00', href: 'tel:+77270000000' },
    { icon: '📱', label: 'WhatsApp', value: '+7 (700) 000-00-00', href: 'https://wa.me/77000000000' },
    { icon: '📧', label: 'Email', value: 'info@jbibeton.kz', href: 'mailto:info@jbibeton.kz' },
    { icon: '📍', label: 'Адрес', value: 'г. Алматы, ул. Промышленная, 15', href: 'https://2gis.kz/almaty' },
    { icon: '⏰', label: 'Режим работы', value: 'Пн–Пт: 8:00–18:00, Сб: 9:00–15:00', href: null },
  ]

  return (
    <div>
      {/* Header */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            📍 Контакты <span className="text-yellow-400">JBI Beton</span>
          </h1>
          <p className="text-gray-400 text-lg">Свяжитесь с нами — ответим в течение 30 минут</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Наши контакты</h2>
            <div className="space-y-4">
              {contacts.map((c) => (
                <div key={c.label} className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm">
                  <span className="text-3xl">{c.icon}</span>
                  <div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{c.label}</div>
                    {c.href ? (
                      <a
                        href={c.href}
                        target={c.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-900 hover:text-yellow-600 transition"
                      >
                        {c.value}
                      </a>
                    ) : (
                      <div className="font-semibold text-gray-900">{c.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="mt-8 rounded-2xl overflow-hidden shadow-sm h-64 bg-gray-200 relative">
              <iframe
                title="JBI Beton location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2907.5!2d76.9286!3d43.2567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDPCsDE1JzI0LjEiTiA3NsKwNTUnNDMuMCJF!5e0!3m2!1sru!2skz!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Написать нам</h2>
            <div className="bg-white rounded-2xl shadow-sm p-8">
              {sent ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Заявка отправлена!</h3>
                  <p className="text-gray-600">Мы свяжемся с вами в течение 30 минут</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Отправить ещё
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('inquiry.name')} *</label>
                    <input
                      required type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-yellow-400 transition"
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('inquiry.phone')} *</label>
                    <input
                      required type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-yellow-400 transition"
                      placeholder="+7 700 000 00 00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('inquiry.message')}</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-yellow-400 transition resize-none"
                      placeholder="Какой товар вас интересует? Какой объём?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold py-4 rounded-xl text-lg transition"
                  >
                    {loading ? 'Отправляем...' : `📞 ${t('inquiry.submit')}`}
                  </button>
                  <p className="text-center text-xs text-gray-400">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                  </p>
                </form>
              )}
            </div>

            {/* Quick contact cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <a
                href="tel:+77270000000"
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl p-4 text-center transition"
              >
                <div className="text-3xl mb-1">📞</div>
                <div className="font-semibold text-sm">Позвонить</div>
              </a>
              <a
                href="https://wa.me/77000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white rounded-xl p-4 text-center transition"
              >
                <div className="text-3xl mb-1">💬</div>
                <div className="font-semibold text-sm">WhatsApp</div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
