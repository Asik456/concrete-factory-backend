import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Product, Language } from '../types'
import { buildWhatsAppOrderLink } from '../utils/whatsapp'
import { COLOR_HEX } from '../utils/colors'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language

  const name = product[`name_${lang}` as keyof Product] as string || product.name_ru

  const hasDiscount = product.discount_price && product.discount_price > 0
  const waLink = buildWhatsAppOrderLink(product, lang)

  const variants = product.variants || []
  const hasVariants = variants.length > 1
  const minPrice = hasVariants ? Math.min(...variants.map((v) => v.price)) : product.price
  const maxPrice = hasVariants ? Math.max(...variants.map((v) => v.price)) : product.price

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

        {hasVariants && (
          <div className="flex items-center gap-1.5 mb-2">
            {variants.map((v) => (
              <span
                key={v.color_key}
                title={t(`product.color_${v.color_key}`)}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: COLOR_HEX[v.color_key] }}
              />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {hasVariants ? (
            <span className="text-xl font-bold text-gray-900">
              {minPrice.toLocaleString()}–{maxPrice.toLocaleString()} тг
            </span>
          ) : hasDiscount ? (
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
        {product.price_wholesale != null && (
          <div className="text-xs text-gray-500 mb-2">
            {t('product.price_wholesale')}: {product.price_wholesale.toLocaleString()} тг
          </div>
        )}

        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition text-sm mt-2"
        >
          {t('product.order_whatsapp')}
        </a>
      </div>
    </div>
  )
}
