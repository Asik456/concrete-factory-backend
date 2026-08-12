import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { createInquiry } from '../api'
import { formatKzPhone } from '../utils/phone'

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
    { icon: '📞', label: t('contact.phone'), value: '+7 747 563 1252', href: 'tel:+77475631252' },
    { icon: '📱', label: 'WhatsApp', value: '+7 747 563 1252', href: 'https://wa.me/77475631252' },
    { icon: '📧', label: 'Email', value: 'toozhsi2030@mail.ru', href: 'mailto:toozhsi2030@mail.ru' },
    { icon: '📍', label: t('contact.address'), value: 'г. Алматы, Турксибский р-н, ул. Спасская, 105/1', href: null },
  ]

  return (
    <div>
      {/* Header */}
      <section className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            📍 {t('contact.title')} <span className="text-yellow-400">JSI Beton</span>
          </h1>
          <p className="text-gray-400 text-lg">{t('contact.subtitle')}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('contact.our_contacts')}</h2>
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
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('contact.write_us')}</h2>
            <div className="bg-white rounded-2xl shadow-sm p-8">
              {sent ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{t('contact.sent_title')}</h3>
                  <p className="text-gray-600">{t('contact.sent_subtitle')}</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    {t('contact.send_more')}
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
                      placeholder={t('contact.name_placeholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('inquiry.phone')} *</label>
                    <input
                      required type="tel"
                      value={form.phone}
                      onFocus={() => { if (!form.phone) setForm({ ...form, phone: '+7 ' }) }}
                      onChange={(e) => setForm({ ...form, phone: formatKzPhone(e.target.value) })}
                      maxLength={16}
                      pattern="\+7 \d{3} \d{3} \d{2} \d{2}"
                      title={t('auth.phone_hint')}
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
                      placeholder={t('contact.message_placeholder')}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold py-4 rounded-xl text-lg transition"
                  >
                    {loading ? t('contact.sending') : `📞 ${t('inquiry.submit')}`}
                  </button>
                  <p className="text-center text-xs text-gray-400">
                    {t('contact.consent')}
                  </p>
                </form>
              )}
            </div>

            {/* Quick contact cards */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <a
                href="tel:+77475631252"
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl p-4 text-center transition"
              >
                <div className="text-3xl mb-1">📞</div>
                <div className="font-semibold text-sm">{t('contact.call')}</div>
              </a>
              <a
                href="https://wa.me/77475631252"
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
