import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCart } from '../store/CartContext'
import { Language } from '../types'

export default function Cart() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('cart.empty')}</h2>
        <Link
          to="/catalog"
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-8 py-3 rounded-lg inline-block transition"
        >
          {t('cart.continue')}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('cart.title')}</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const name = (item.product as any)[`name_${lang}`] || item.product.name_ru
          const price = item.product.discount_price ?? item.product.price

          return (
            <div key={item.product.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product.image ? (
                  <img src={item.product.image} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🧱</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.product.id}`} className="font-semibold text-gray-900 hover:text-yellow-600 line-clamp-1">
                  {name}
                </Link>
                <p className="text-yellow-600 font-bold mt-1">{price.toLocaleString()} тг</p>
              </div>

              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 font-bold"
                >−</button>
                <span className="px-4 py-1 font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 font-bold"
                >+</button>
              </div>

              <div className="text-right min-w-16">
                <p className="font-bold text-gray-900">{(price * item.quantity).toLocaleString()} тг</p>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id)}
                className="text-red-400 hover:text-red-600 text-xl ml-2"
              >✕</button>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">{t('cart.total')}:</span>
          <span className="text-2xl font-bold text-gray-900">{total.toLocaleString()} тг</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={clearCart}
            className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition"
          >
            {t('cart.remove')} все
          </button>
          <Link
            to="/checkout"
            className="flex-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-3 px-8 rounded-lg text-center transition"
          >
            {t('cart.checkout')}
          </Link>
        </div>
      </div>
    </div>
  )
}
