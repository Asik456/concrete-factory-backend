import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Product, Language } from '../types'
import { useCart } from '../store/CartContext'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { t, i18n } = useTranslation()
  const { addToCart } = useCart()
  const lang = i18n.language as Language

  const name = product[`name_${lang}` as keyof Product] as string || product.name_ru

  const hasDiscount = product.discount_price && product.discount_price > 0

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group">
      <Link to={`/products/${product.id}`}>
        <div className="h-48 bg-gray-100 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🧱</div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-yellow-600 transition line-clamp-2 mb-2">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          {hasDiscount ? (
            <>
              <span className="text-xl font-bold text-red-600">
                {product.discount_price?.toLocaleString()} тг
              </span>
              <span className="text-sm text-gray-400 line-through">
                {product.price.toLocaleString()} тг
              </span>
              <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded font-semibold">
                -{Math.round((1 - product.discount_price! / product.price) * 100)}%
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-gray-900">
              {product.price.toLocaleString()} тг
            </span>
          )}
        </div>

        <button
          onClick={() => addToCart(product)}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-2 rounded-lg transition text-sm"
        >
          {t('product.add_to_cart')}
        </button>
      </div>
    </div>
  )
}
