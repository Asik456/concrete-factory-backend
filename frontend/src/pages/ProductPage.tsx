import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Product, Language } from '../types'
import { getProductById } from '../api'
import { useCart } from '../store/CartContext'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductById(Number(id))
      .then((res) => setProduct(res.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20">{t('common.loading')}</div>
  if (!product) return <div className="text-center py-20 text-red-500">{t('common.error')}</div>

  const name = product[`name_${lang}` as keyof Product] as string || product.name_ru
  const description = product[`description_${lang}` as keyof Product] as string || product.description_ru
  const hasDiscount = product.discount_price && product.discount_price > 0
  const currentPrice = hasDiscount ? product.discount_price! : product.price

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/catalog" className="text-yellow-600 hover:text-yellow-700 text-sm mb-6 inline-block">
        ← {t('common.back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80 md:h-auto">
          {product.image ? (
            <img src={product.image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🧱</div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{name}</h1>

          <div className="flex items-center gap-3 mb-6">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold text-red-600">
                  {product.discount_price?.toLocaleString()} тг
                </span>
                <span className="text-xl text-gray-400 line-through">
                  {product.price.toLocaleString()} тг
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded font-semibold text-sm">
                  -{Math.round((1 - product.discount_price! / product.price) * 100)}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-gray-900">
                {product.price.toLocaleString()} тг
              </span>
            )}
          </div>

          {/* Specs */}
          {product.specs && product.specs.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">{t('product.specs')}</h3>
              <div className="border rounded-xl overflow-hidden">
                {product.specs.map((spec, i) => (
                  <div
                    key={spec.id || i}
                    className={`flex px-4 py-2 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <span className="text-gray-500 w-1/2">{spec.key}</span>
                    <span className="font-medium text-gray-900 w-1/2">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">{t('product.description')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
            </div>
          )}

          {/* Quantity + Cart */}
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold transition"
              >−</button>
              <span className="px-6 py-2 font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-lg font-bold transition"
              >+</button>
            </div>

            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3 rounded-lg font-bold text-lg transition ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-gray-900'
              }`}
            >
              {added ? '✓ Добавлено!' : t('product.add_to_cart')}
            </button>
          </div>

          <div className="mt-4 text-sm text-green-600 font-medium">
            ✓ {t('product.in_stock')}
          </div>
        </div>
      </div>
    </div>
  )
}
