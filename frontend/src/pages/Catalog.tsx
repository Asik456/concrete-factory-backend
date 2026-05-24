import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Product, Category, Language } from '../types'
import { getProducts, getCategories } from '../api'
import ProductCard from '../components/ProductCard'

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'discount'

export default function Catalog() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language as Language
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('default')
  const [onlyDiscount, setOnlyDiscount] = useState(false)

  const categoryId = searchParams.get('category_id')
    ? Number(searchParams.get('category_id'))
    : undefined

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    getProducts({ category_id: categoryId, active: true })
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false))
  }, [categoryId])

  const filtered = useMemo(() => {
    let result = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) =>
        p.name_ru?.toLowerCase().includes(q) ||
        p.name_kz?.toLowerCase().includes(q) ||
        p.name_en?.toLowerCase().includes(q)
      )
    }

    if (onlyDiscount) {
      result = result.filter((p) => p.discount_price && p.discount_price > 0)
    }

    if (sort === 'price_asc') result.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price))
    if (sort === 'price_desc') result.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price))
    if (sort === 'discount') result.sort((a, b) => (b.discount_price ? 1 : 0) - (a.discount_price ? 1 : 0))

    return result
  }, [products, search, sort, onlyDiscount])

  const selectedCategory = categories.find((c) => c.id === categoryId)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('catalog.title')}</h1>

      {/* Search bar */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          type="text"
          placeholder="Поиск по названию товара..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-yellow-400 bg-white shadow-sm text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
          >×</button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Category buttons */}
        <button
          onClick={() => setSearchParams({})}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            !categoryId ? 'bg-yellow-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-700 hover:border-yellow-300'
          }`}
        >
          {t('catalog.all')}
        </button>
        {categories.map((cat) => {
          const name = cat[`name_${lang}` as keyof Category] as string || cat.name_ru
          return (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category_id: String(cat.id) })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                categoryId === cat.id ? 'bg-yellow-400 text-gray-900' : 'bg-white border border-gray-200 text-gray-700 hover:border-yellow-300'
              }`}
            >
              {name}
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-3">
          {/* Discount toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyDiscount}
              onChange={(e) => setOnlyDiscount(e.target.checked)}
              className="w-4 h-4 accent-yellow-400"
            />
            <span className="text-sm text-gray-700">🔥 Только акции</span>
          </label>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 bg-white"
          >
            <option value="default">По умолчанию</option>
            <option value="price_asc">Цена: по возрастанию</option>
            <option value="price_desc">Цена: по убыванию</option>
            <option value="discount">Сначала акции</option>
          </select>
        </div>
      </div>

      {selectedCategory && (
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          {selectedCategory[`name_${lang}` as keyof Category] as string || selectedCategory.name_ru}
        </h2>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          {filtered.length > 0 ? `Найдено: ${filtered.length} товаров` : ''}
        </p>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg">{t('catalog.no_products')}</p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium">
              Сбросить поиск
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
