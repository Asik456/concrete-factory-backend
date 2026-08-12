import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Product, Category, ProductSpec, ProductVariant, ColorKey } from '../../types'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../../api'

const COLOR_OPTIONS: ColorKey[] = ['grey', 'red', 'black']

type SortOption = 'default' | 'name_asc' | 'price_asc' | 'price_desc'

const emptyForm = {
  category_id: 0, name_ru: '', name_kz: '', name_en: '',
  description_ru: '', description_kz: '', description_en: '',
  price: 0, discount_price: '', price_wholesale: '', image: '', is_active: true,
  specs: [] as ProductSpec[],
  variants: [] as ProductVariant[],
}

export default function AdminProducts() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ ...emptyForm })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number>(0)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sort, setSort] = useState<SortOption>('default')

  const load = () => {
    getProducts().then((r) => setProducts(r.data))
    getCategories().then((r) => setCategories(r.data))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = [...products]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) =>
        p.name_ru?.toLowerCase().includes(q) ||
        p.name_kz?.toLowerCase().includes(q) ||
        p.name_en?.toLowerCase().includes(q)
      )
    }

    if (categoryFilter) {
      result = result.filter((p) => p.category_id === categoryFilter)
    }

    if (activeFilter !== 'all') {
      result = result.filter((p) => (activeFilter === 'active' ? p.is_active : !p.is_active))
    }

    if (sort === 'name_asc') result.sort((a, b) => a.name_ru.localeCompare(b.name_ru))
    if (sort === 'price_asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'price_desc') result.sort((a, b) => b.price - a.price)

    return result
  }, [products, search, categoryFilter, activeFilter, sort])

  const addSpec = () => setForm({ ...form, specs: [...form.specs, { key: '', value: '' }] })
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => {
    const specs = [...form.specs]
    specs[i] = { ...specs[i], [field]: val }
    setForm({ ...form, specs })
  }
  const removeSpec = (i: number) => setForm({ ...form, specs: form.specs.filter((_, idx) => idx !== i) })

  const addVariant = () => setForm({ ...form, variants: [...form.variants, { color_key: 'grey', price: 0 }] })
  const updateVariant = (i: number, field: 'color_key' | 'price', val: string) => {
    const variants = [...form.variants]
    variants[i] = { ...variants[i], [field]: field === 'price' ? Number(val) : (val as ColorKey) }
    setForm({ ...form, variants })
  }
  const removeVariant = (i: number) => setForm({ ...form, variants: form.variants.filter((_, idx) => idx !== i) })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      price_wholesale: form.price_wholesale ? Number(form.price_wholesale) : null,
      category_id: Number(form.category_id),
    }
    if (editingId) {
      await updateProduct(editingId, payload)
    } else {
      await createProduct(payload)
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyForm })
    load()
  }

  const handleEdit = (p: Product) => {
    setForm({
      category_id: p.category_id,
      name_ru: p.name_ru, name_kz: p.name_kz, name_en: p.name_en,
      description_ru: p.description_ru, description_kz: p.description_kz, description_en: p.description_en,
      price: p.price,
      discount_price: p.discount_price ? String(p.discount_price) : '',
      price_wholesale: p.price_wholesale ? String(p.price_wholesale) : '',
      image: p.image, is_active: p.is_active,
      specs: p.specs || [],
      variants: p.variants || [],
    })
    setEditingId(p.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirm_delete'))) return
    await deleteProduct(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.products')}</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }) }}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition"
        >
          + {t('admin.add_product')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">{editingId ? t('admin.edit') : t('admin.add_product')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.category')}</label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400"
                >
                  <option value={0}>{t('admin.select_category')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ru}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">{t('admin.active')}</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['name_ru', 'name_kz', 'name_en'].map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t(`admin.${key}`)}</label>
                  <input
                    required={key === 'name_ru'}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['description_ru', 'description_kz', 'description_en'].map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t(`admin.${key}`)}</label>
                  <textarea
                    rows={3}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400 resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.price')}</label>
                <input required type="number" min="0" value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.discount_price')}</label>
                <input type="number" min="0" value={form.discount_price}
                  onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.image')}</label>
                <input type="url" value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.price_wholesale')}</label>
                <input type="number" min="0" value={form.price_wholesale}
                  onChange={(e) => setForm({ ...form, price_wholesale: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400" />
              </div>
            </div>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">{t('admin.variants')}</label>
                <button type="button" onClick={addVariant}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition">
                  + {t('admin.add_variant')}
                </button>
              </div>
              <div className="space-y-2">
                {form.variants.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <select value={v.color_key}
                      onChange={(e) => updateVariant(i, 'color_key', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400">
                      {COLOR_OPTIONS.map((c) => (
                        <option key={c} value={c}>{t(`product.color_${c}`)}</option>
                      ))}
                    </select>
                    <input type="number" min="0" placeholder={t('admin.price')} value={v.price}
                      onChange={(e) => updateVariant(i, 'price', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400" />
                    <button type="button" onClick={() => removeVariant(i)}
                      className="text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">{t('product.specs')}</label>
                <button type="button" onClick={addSpec}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg transition">
                  + {t('admin.add_spec')}
                </button>
              </div>
              <div className="space-y-2">
                {form.specs.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder={t('admin.spec_key')} value={spec.key}
                      onChange={(e) => updateSpec(i, 'key', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400" />
                    <input placeholder={t('admin.spec_value')} value={spec.value}
                      onChange={(e) => updateSpec(i, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400" />
                    <button type="button" onClick={() => removeSpec(i)}
                      className="text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-2 rounded-lg transition">
                {t('admin.save')}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition">
                {t('admin.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search / filter / sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('catalog.search_placeholder')}
          className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(Number(e.target.value))}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        >
          <option value={0}>{t('catalog.all')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name_ru}</option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        >
          <option value="all">{t('admin.filter_all_status')}</option>
          <option value="active">{t('admin.filter_active')}</option>
          <option value="inactive">{t('admin.filter_inactive')}</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-yellow-400"
        >
          <option value="default">{t('catalog.sort_default')}</option>
          <option value="name_asc">{t('admin.sort_name')}</option>
          <option value="price_asc">{t('catalog.sort_price_asc')}</option>
          <option value="price_desc">{t('catalog.sort_price_desc')}</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">{t('admin.name_ru')}</th>
              <th className="text-left px-4 py-3">{t('admin.price')}</th>
              <th className="text-left px-4 py-3">{t('admin.discount_price')}</th>
              <th className="text-left px-4 py-3">{t('admin.active')}</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-gray-500 py-10">{t('catalog.no_products')}</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{p.id}</td>
                <td className="px-4 py-3 font-medium">{p.name_ru}</td>
                <td className="px-4 py-3">{p.price.toLocaleString()} тг</td>
                <td className="px-4 py-3 text-red-500">{p.discount_price ? `${p.discount_price.toLocaleString()} тг` : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active ? '✓' : '✗'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700 mr-3">{t('admin.edit')}</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">{t('admin.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
