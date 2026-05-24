import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Order } from '../../types'
import { getAllOrders, updateOrderStatus } from '../../api'

const statuses = ['pending', 'confirmed', 'delivered', 'cancelled']

export default function AdminOrders() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<Order[]>([])

  const load = () => getAllOrders().then((r) => setOrders(r.data))
  useEffect(() => { load() }, [])

  const handleStatus = async (id: number, status: string) => {
    await updateOrderStatus(id, status)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.orders')}</h1>

      {orders.length === 0 ? (
        <div className="text-gray-500 text-center py-20">{t('admin.no_orders')}</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="font-bold text-gray-900">
                  {t('orders.order_number')}{order.id}
                  <span className="text-gray-500 font-normal text-sm ml-3">
                    {new Date(order.created_at).toLocaleDateString()} — User #{order.user_id}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {order.payment_status === 'paid' ? t('orders.payment_paid') : t('orders.payment_unpaid')}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatus(order.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1 focus:outline-none focus:border-yellow-400"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{t(`orders.status_${s}`)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {order.items && (
                <div className="text-sm text-gray-600 mb-3 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>Товар #{item.product_id} × {item.quantity}</span>
                      <span>{(item.price_at_order * item.quantity).toLocaleString()} тг</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">
                  {order.delivery_type === 'delivery' ? '🚚 ' + order.delivery_address : '🏭 Самовывоз'}
                </span>
                <span className="font-bold text-lg">{order.total.toLocaleString()} тг</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
