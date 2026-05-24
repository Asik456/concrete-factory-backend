import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Inquiry } from '../../types'
import { getInquiries, markInquiryRead } from '../../api'

export default function AdminInquiries() {
  const { t } = useTranslation()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])

  const load = () => getInquiries().then((r) => setInquiries(r.data))
  useEffect(() => { load() }, [])

  const handleRead = async (id: number) => {
    await markInquiryRead(id)
    load()
  }

  const unread = inquiries.filter((i) => !i.is_read).length

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.inquiries')}</h1>
        {unread > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {unread} {t('admin.unread')}
          </span>
        )}
      </div>

      {inquiries.length === 0 ? (
        <div className="text-gray-500 text-center py-20">{t('admin.no_inquiries')}</div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div
              key={inq.id}
              className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
                inq.is_read ? 'border-gray-200' : 'border-yellow-400'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{inq.name}</span>
                    <a href={`tel:${inq.phone}`} className="text-yellow-600 font-medium hover:text-yellow-700">
                      📞 {inq.phone}
                    </a>
                    {!inq.is_read && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {t('admin.unread')}
                      </span>
                    )}
                  </div>
                  {inq.message && <p className="text-gray-600 text-sm">{inq.message}</p>}
                  <p className="text-gray-400 text-xs mt-2">
                    {new Date(inq.created_at).toLocaleString()}
                  </p>
                </div>
                {!inq.is_read && (
                  <button
                    onClick={() => handleRead(inq.id)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                  >
                    {t('admin.mark_read')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
