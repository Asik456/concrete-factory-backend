import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '../store/CartContext'
import { useAuth } from '../store/AuthContext'
import { createOrder, checkout } from '../api'
import { Language } from '../types'

export default function Checkout() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const { items, total, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    delivery_type: 'delivery',
    delivery_address: '',
    payment_method: 'card',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const deliveryCost = form.delivery_type === 'delivery' ? 3000 : 0
  const grandTotal = total + deliveryCost

  if (!user) {
    navigate('/login')
    return null
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const orderPayload = {
        delivery_type: form.delivery_type,
        delivery_address: form.delivery_address,
        delivery_cost: deliveryCost,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      }
      const orderRes = await createOrder(orderPayload)
      const orderId = orderRes.data.id

      if (form.payment_method === 'card') {
        await checkout(orderId, 'card')
      }

      clearCart()
      navigate('/my-orders')
    } catch {
      setError('Ошибка при оформлении заказа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('checkout.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery type */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('checkout.delivery_type')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {['delivery', 'pickup'].map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    form.delivery_type === type ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_type"
                    value={type}
                    checked={form.delivery_type === type}
                    onChange={(e) => setForm({ ...form, delivery_type: e.target.value })}
                    className="text-yellow-400"
                  />
                  <div>
                    <div className="font-medium">{type === 'delivery' ? `🚚 ${t('checkout.delivery')}` : `🏭 ${t('checkout.pickup')}`}</div>
                    {type === 'delivery' && <div className="text-xs text-gray-500">+3 000 тг</div>}
                    {type === 'pickup' && <div className="text-xs text-green-600">Бесплатно</div>}
                  </div>
                </label>
              ))}
            </div>

            {form.delivery_type === 'delivery' && (
              <input
                required
                type="text"
                placeholder={t('checkout.address')}
                value={form.delivery_address}
                onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                className="mt-4 w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-yellow-400"
              />
            )}
          </div>

          {/* Payment */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t('checkout.payment_method')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'card', label: `💳 ${t('checkout.card')}` },
                { value: 'cash', label: `💵 ${t('checkout.cash')}` },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition ${
                    form.payment_method === method.value ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.value}
                    checked={form.payment_method === method.value}
                    onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  />
                  <span className="font-medium">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-bold py-4 rounded-xl text-lg transition"
          >
            {loading ? t('common.loading') : t('checkout.place_order')}
          </button>
        </form>

        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">{t('checkout.order_summary')}</h3>
          <div className="space-y-3 mb-4">
            {items.map((item) => {
              const name = (item.product as any)[`name_${lang}`] || item.product.name_ru
              const price = item.product.discount_price ?? item.product.price
              return (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">{name} × {item.quantity}</span>
                  <span className="font-medium">{(price * item.quantity).toLocaleString()} тг</span>
                </div>
              )
            })}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('checkout.delivery_cost')}</span>
              <span>{deliveryCost > 0 ? `${deliveryCost.toLocaleString()} тг` : 'Бесплатно'}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>{t('checkout.total')}</span>
              <span>{grandTotal.toLocaleString()} тг</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
