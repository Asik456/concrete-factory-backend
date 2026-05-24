import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Product, Category, ProductSpec } from '../../types'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../../api'

const emptyForm = {
  category_id: 0, name_ru: '', name_kz: '', name_en: '',
  description_ru: '', description_kz: '', description_en: '',
  price: 0, discount_price: '', image: '', is_active: true,
  specs: [] as ProductSpec[],
}

export default function AdminProducts() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({ ...emptyForm })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    getProducts().then((r) => setProducts(r.data))
    getCategories().then((r) => setCategories(r.data))
  }

  useEffect(() => { load() }, [])

  const addSpec = () => setForm({ ...form, specs: [...form.specs, { key: '', value: '' }] })
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => {
    const specs = [...form.specs]
    specs[i] = { ...specs[i], [field]: val }
    setForm({ ...form, specs })
  }
  const removeSpec = (i: number) => setForm({ ...form, specs: form.specs.filter((_, idx) => idx !== i) })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      price: Number(form.price),
      discount_price: form.discount_price ? Number(form.discount_price) : null,
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
      image: p.image, is_active: p.is_active,
      specs: p.specs || [],
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
                  <option value={0}>-- выберите --</option>
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

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
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
            {products.map((p) => (
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
