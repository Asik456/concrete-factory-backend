import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Order } from '../types'
import { getMyOrders, checkout } from '../api'
import { useAuth } from '../store/AuthContext'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyOrders() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    getMyOrders()
      .then((res) => setOrders(res.data))
      .finally(() => setLoading(false))
  }, [user])

  const handlePay = async (orderId: number) => {
    await checkout(orderId, 'card')
    getMyOrders().then((res) => setOrders(res.data))
  }

  if (loading) return <div className="text-center py-20">{t('common.loading')}</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">{t('orders.empty')}</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <span className="font-bold text-gray-900">{t('orders.order_number')}{order.id}</span>
                  <span className="text-gray-500 text-sm ml-3">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                    {t(`orders.status_${order.status}`) || order.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {order.payment_status === 'paid' ? t('orders.payment_paid') : t('orders.payment_unpaid')}
                  </span>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between py-1 border-b last:border-0">
                      <span>Товар #{item.product_id} × {item.quantity}</span>
                      <span>{(item.price_at_order * item.quantity).toLocaleString()} тг</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {order.delivery_type === 'delivery' ? '🚚 Доставка' : '🏭 Самовывоз'}
                  {order.delivery_address && `: ${order.delivery_address}`}
                </span>
                <div className="flex items-center gap-4">
                  {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                    <button
                      onClick={() => handlePay(order.id)}
                      className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm transition"
                    >
                      {t('orders.pay_now')} 💳
                    </button>
                  )}
                  <span className="font-bold text-lg">{order.total.toLocaleString()} тг</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
