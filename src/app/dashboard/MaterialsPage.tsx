import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import {
  getMaterials, createMaterial, updateMaterial,
  toggleMaterial, deleteMaterial,
  type MaterialRow,
} from '../../services/materialsService'
import type { StoneMaterial } from '../../types'

type Category = 'todos' | StoneMaterial['category']

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'todos',   label: 'Todos'    },
  { key: 'granito', label: 'Granito'  },
  { key: 'marmore', label: 'Mármore'  },
  { key: 'quartzo', label: 'Quartzo'  },
  { key: 'ultra',   label: 'Ultra'    },
]

const BLANK: Omit<MaterialRow, 'id' | 'created_at'> = {
  name: '', category: 'granito', color: '#888888', secondaryColor: '',
  textureType: 'granite', pricePerM2: 0, pricePerML_Saia: 0,
  pricePerML_Frontao: 0, roughness: 0.15, metalness: 0.1, active: true,
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<Category>('todos')
  const [search,    setSearch]    = useState('')
  const [panel,     setPanel]     = useState<'closed' | 'add' | 'edit'>('closed')
  const [form,      setForm]      = useState<Omit<MaterialRow, 'id' | 'created_at'>>(BLANK)
  const [editId,    setEditId]    = useState<string | null>(null)
  const [saving,    setSaving]    = useState(false)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setMaterials(await getMaterials()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = materials.filter((m) => {
    if (filter !== 'todos' && m.category !== filter) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openAdd() {
    setForm(BLANK)
    setEditId(null)
    setPanel('add')
  }

  function openEdit(m: MaterialRow) {
    setForm({ ...m })
    setEditId(m.id)
    setPanel('edit')
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (panel === 'add') {
        await createMaterial('local', form)
      } else if (editId) {
        await updateMaterial(editId, form)
      }
      await load()
      setPanel('closed')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id: string, active: boolean) {
    await toggleMaterial(id, !active)
    setMaterials((prev) => prev.map((m) => m.id === id ? { ...m, active: !active } : m))
  }

  async function handleDelete(id: string) {
    await deleteMaterial(id)
    setMaterials((prev) => prev.filter((m) => m.id !== id))
    setDeleteId(null)
  }

  return (
    <DashboardLayout>
      <div className="p-8 lg:p-12 max-w-6xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Materiais</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {materials.length} pedras no catálogo · {materials.filter((m) => m.active).length} ativas
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-on-primary font-bold py-2.5 px-5 rounded-lg hover:bg-primary-fixed hover:-translate-y-0.5 transition-all active:scale-95 text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Adicionar Material
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-1 p-1 bg-surface-container rounded-xl border border-outline-variant">
            {CATEGORIES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-surface-container-highest text-primary'
                    : 'text-secondary hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-3 block opacity-30">layers</span>
            <p className="font-medium">Nenhum material encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((m) => (
              <div
                key={m.id}
                className={`bg-surface-container border rounded-2xl overflow-hidden transition-all group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${
                  m.active ? 'border-outline-variant' : 'border-outline-variant/40 opacity-50'
                }`}
              >
                {/* Swatch de cor */}
                <div
                  className="h-24 w-full relative"
                  style={{ backgroundColor: m.color }}
                >
                  {m.secondaryColor && (
                    <div
                      className="absolute bottom-0 right-0 w-10 h-10"
                      style={{ backgroundColor: m.secondaryColor }}
                    />
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 text-white/90">
                    {m.category}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-on-surface text-sm truncate">{m.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    R$ {m.pricePerM2.toFixed(0)}/m² · saia R$ {m.pricePerML_Saia.toFixed(0)}/ml
                  </p>
                </div>

                {/* Ações */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex-1 py-1.5 rounded-lg border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container-high text-xs font-medium transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleToggle(m.id, m.active)}
                    title={m.active ? 'Desativar' : 'Ativar'}
                    className="p-1.5 rounded-lg border border-outline-variant text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {m.active ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    title="Excluir"
                    className="p-1.5 rounded-lg border border-outline-variant text-secondary hover:text-error hover:bg-error-container/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel lateral Add/Edit */}
      {panel !== 'closed' && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setPanel('closed')} />
          <aside className="w-full max-w-md bg-surface-container-low border-l border-outline-variant flex flex-col shadow-2xl">
            <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-black text-on-surface">
                {panel === 'add' ? 'Novo Material' : 'Editar Material'}
              </h2>
              <button onClick={() => setPanel('closed')} className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              <Field label="Nome do material">
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Preto São Gabriel" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Categoria">
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as StoneMaterial['category'] })} className={inputCls}>
                    <option value="granito">Granito</option>
                    <option value="marmore">Mármore</option>
                    <option value="quartzo">Quartzo</option>
                    <option value="ultra">Ultra Compacto</option>
                  </select>
                </Field>
                <Field label="Textura">
                  <select value={form.textureType} onChange={(e) => setForm({ ...form, textureType: e.target.value as StoneMaterial['textureType'] })} className={inputCls}>
                    <option value="solid">Sólido</option>
                    <option value="marble">Mármore</option>
                    <option value="granite">Granito</option>
                    <option value="composite">Composto</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Cor principal">
                  <div className="flex gap-2">
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer bg-transparent" />
                    <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className={`${inputCls} flex-1`} />
                  </div>
                </Field>
                <Field label="Cor secundária">
                  <div className="flex gap-2">
                    <input type="color" value={form.secondaryColor || '#888888'} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer bg-transparent" />
                    <input type="text" value={form.secondaryColor || ''} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                      className={`${inputCls} flex-1`} placeholder="opcional" />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Preço/m²">
                  <PriceInput value={form.pricePerM2} onChange={(v) => setForm({ ...form, pricePerM2: v })} />
                </Field>
                <Field label="Saia ml">
                  <PriceInput value={form.pricePerML_Saia} onChange={(v) => setForm({ ...form, pricePerML_Saia: v })} />
                </Field>
                <Field label="Frontão ml">
                  <PriceInput value={form.pricePerML_Frontao} onChange={(v) => setForm({ ...form, pricePerML_Frontao: v })} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Rugosidade (0-1)">
                  <input type="number" step="0.01" min="0" max="1" value={form.roughness}
                    onChange={(e) => setForm({ ...form, roughness: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Metalness (0-1)">
                  <input type="number" step="0.01" min="0" max="1" value={form.metalness}
                    onChange={(e) => setForm({ ...form, metalness: Number(e.target.value) })} className={inputCls} />
                </Field>
              </div>

            </div>

            <div className="p-6 border-t border-outline-variant">
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary font-bold py-3 rounded-xl hover:bg-primary-fixed transition-all active:scale-95 disabled:opacity-40"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />Salvando...</>
                  : <><span className="material-symbols-outlined text-[18px]">save</span>{panel === 'add' ? 'Adicionar' : 'Salvar alterações'}</>
                }
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Confirmação de exclusão */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <span className="material-symbols-outlined text-error text-[36px] mb-3 block"
              style={{ fontVariationSettings: "'FILL' 1" }}>
              delete_forever
            </span>
            <h3 className="font-black text-on-surface mb-1">Excluir material?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Esta ação não pode ser desfeita. Orçamentos existentes não serão afetados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-error text-on-error text-sm font-bold hover:opacity-90 transition-opacity">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

// ---- Sub-components ----

const inputCls = 'w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function PriceInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-secondary">R$</span>
      <input type="number" min="0" step="0.01" value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${inputCls} pl-8`} />
    </div>
  )
}
