import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Category } from '../../types'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api'

const empty = { id: 0, name_ru: '', name_kz: '', name_en: '', slug: '' }

export default function AdminCategories() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<Category>({ ...empty })
  const [editing, setEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = () => getCategories().then((r) => setCategories(r.data))

  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await updateCategory(form.id, form)
    } else {
      await createCategory(form)
    }
    setShowForm(false)
    setForm({ ...empty })
    setEditing(false)
    load()
  }

  const handleEdit = (cat: Category) => {
    setForm({ ...cat })
    setEditing(true)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.confirm_delete'))) return
    await deleteCategory(id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.categories')}</h1>
        <button
          onClick={() => { setShowForm(true); setEditing(false); setForm({ ...empty }) }}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition"
        >
          + {t('admin.add_category')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">{editing ? t('admin.edit') : t('admin.add_category')}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'name_ru', label: t('admin.name_ru') },
              { key: 'name_kz', label: t('admin.name_kz') },
              { key: 'name_en', label: t('admin.name_en') },
              { key: 'slug', label: t('admin.slug') },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  required={field.key !== 'name_kz' && field.key !== 'name_en'}
                  value={(form as any)[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-yellow-400"
                />
              </div>
            ))}
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-6 py-2 rounded-lg transition">
                {t('admin.save')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition">
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
              <th className="text-left px-4 py-3">{t('admin.name_kz')}</th>
              <th className="text-left px-4 py-3">{t('admin.slug')}</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{cat.id}</td>
                <td className="px-4 py-3 font-medium">{cat.name_ru}</td>
                <td className="px-4 py-3 text-gray-500">{cat.name_kz}</td>
                <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEdit(cat)} className="text-blue-500 hover:text-blue-700 mr-3">{t('admin.edit')}</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:text-red-700">{t('admin.delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
