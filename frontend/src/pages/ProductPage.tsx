import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Product, Language, ColorKey } from '../types'
import { getProductById } from '../api'
import { buildWhatsAppOrderLink } from '../utils/whatsapp'
import { COLOR_HEX } from '../utils/colors'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorKey | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductById(Number(id))
      .then((res) => {
        setProduct(res.data)
        if (res.data.variants?.length > 0) {
          setSelectedColor(res.data.variants[0].color_key)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-20">{t('common.loading')}</div>
  if (!product) return <div className="text-center py-20 text-red-500">{t('common.error')}</div>

  const name = product[`name_${lang}` as keyof Product] as string || product.name_ru
  const description = product[`description_${lang}` as keyof Product] as string || product.description_ru
  const hasDiscount = product.discount_price && product.discount_price > 0

  const selectedVariant = product.variants?.find((v) => v.color_key === selectedColor)
  const currentPrice = selectedVariant ? selectedVariant.price : (hasDiscount ? product.discount_price! : product.price)
  const displayImage = selectedVariant?.image || product.image

  const waLink = buildWhatsAppOrderLink(product, lang, selectedVariant?.color_key)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/catalog" className="text-yellow-600 hover:text-yellow-700 text-sm mb-6 inline-block">
        ← {t('common.back')}
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden bg-gray-100 h-80 md:h-auto">
          {displayImage ? (
            <img src={displayImage} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">🧱</div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{name}</h1>

          <div className="flex items-center gap-3 mb-1 flex-wrap">
            {!selectedVariant && hasDiscount ? (
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
                {currentPrice.toLocaleString()} тг
              </span>
            )}
          </div>
          {product.price_wholesale != null && (
            <div className="text-sm text-gray-500 mb-4">
              {t('product.price_wholesale')}: {product.price_wholesale.toLocaleString()} тг
            </div>
          )}

          {/* Color variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">{t('product.color')}</h3>
              <div className="flex gap-3">
                {product.variants.map((v) => (
                  <button
                    key={v.color_key}
                    onClick={() => setSelectedColor(v.color_key)}
                    title={t(`product.color_${v.color_key}`)}
                    className={`w-9 h-9 rounded-full border-2 transition ${
                      selectedColor === v.color_key ? 'border-yellow-500 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: COLOR_HEX[v.color_key] }}
                  />
                ))}
              </div>
            </div>
          )}

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

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-3 rounded-lg transition"
          >
            {t('product.order_whatsapp')}
          </a>

          <div className="mt-4 text-sm text-green-600 font-medium">
            ✓ {t('product.in_stock')}
          </div>
        </div>
      </div>
    </div>
  )
}
