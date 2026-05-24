import { Link } from 'react-router-dom'

const timeline = [
  { year: '2010', text: 'Основание завода JBI Beton в Алматы. Первая линия по производству бетонных блоков.' },
  { year: '2013', text: 'Запуск производства бетонных колец и расширение ассортимента.' },
  { year: '2016', text: 'Открытие второго производственного цеха. Рост мощности до 500 м³/сутки.' },
  { year: '2019', text: 'Получение сертификата ISO 9001:2015. Внедрение системы контроля качества.' },
  { year: '2022', text: 'Запуск собственного автопарка для доставки по Алматы и области.' },
  { year: '2024', text: 'Более 500 постоянных клиентов. Крупнейший производитель ЖБИ в регионе.' },
]

const team = [
  { name: 'Нурлан Сейткали', role: 'Генеральный директор', emoji: '👨‍💼' },
  { name: 'Асем Жакупова', role: 'Технический директор', emoji: '👩‍🔧' },
  { name: 'Руслан Ахметов', role: 'Начальник производства', emoji: '👨‍🏭' },
  { name: 'Динара Бекова', role: 'Менеджер по продажам', emoji: '👩‍💼' },
]

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            О компании <span className="text-yellow-400">JBI Beton</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Мы производим качественные железобетонные изделия в Алматы с 2010 года.
            Наша цель — надёжность, доступность и своевременная доставка.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Наша миссия</h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                JBI Beton — это завод полного цикла. Мы сами производим, контролируем качество и доставляем
                продукцию. Прямые цены без посредников позволяют нашим клиентам экономить до 30% по
                сравнению с рыночными предложениями.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Каждый продукт проходит лабораторный контроль и соответствует ГОСТ и строительным нормам РК.
                Мы работаем как с частными застройщиками, так и с крупными строительными компаниями.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/catalog"
                  className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition"
                >
                  Смотреть каталог
                </Link>
                <Link
                  to="/contact"
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold px-6 py-3 rounded-xl transition"
                >
                  Связаться с нами
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '14+', label: 'лет опыта', bg: 'bg-yellow-400', text: 'text-gray-900' },
                { value: '500+', label: 'клиентов', bg: 'bg-gray-900', text: 'text-yellow-400' },
                { value: '1000+', label: 'проектов', bg: 'bg-gray-900', text: 'text-yellow-400' },
                { value: '50+', label: 'видов продукции', bg: 'bg-yellow-400', text: 'text-gray-900' },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} ${s.text} rounded-2xl p-6 text-center`}>
                  <div className="text-4xl font-black">{s.value}</div>
                  <div className="text-sm font-medium mt-1 opacity-80">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">История компании</h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-yellow-400" />
            <div className="space-y-8">
              {timeline.map((item) => (
                <div key={item.year} className="flex gap-6 items-start">
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center font-black text-gray-900 text-sm">
                    {item.year}
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm flex-1 mt-2">
                    <p className="text-gray-700">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Certificates */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Сертификаты и лицензии</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🏅', title: 'ISO 9001:2015', desc: 'Система менеджмента качества' },
              { icon: '📋', title: 'ГОСТ 13015', desc: 'Стандарт ЖБИ изделий' },
              { icon: '🔬', title: 'Лабораторный контроль', desc: 'Собственная испытательная лаборатория' },
              { icon: '🏗️', title: 'Лицензия МИО', desc: 'Лицензия на строительную деятельность РК' },
            ].map((cert) => (
              <div key={cert.title} className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100">
                <div className="text-4xl mb-3">{cert.icon}</div>
                <div className="font-semibold text-gray-900 mb-1">{cert.title}</div>
                <div className="text-gray-500 text-xs">{cert.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Наша команда</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="text-6xl mb-3">{member.emoji}</div>
                <div className="font-semibold text-gray-900">{member.name}</div>
                <div className="text-gray-500 text-sm mt-1">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-yellow-400">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Готовы сотрудничать?</h2>
          <p className="text-gray-800 mb-8">Свяжитесь с нами для получения коммерческого предложения</p>
          <Link
            to="/contact"
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-10 py-4 rounded-xl text-lg transition"
          >
            Написать нам
          </Link>
        </div>
      </section>
    </div>
  )
}
