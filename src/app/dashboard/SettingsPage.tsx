import { useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { useAuthStore } from '../../store/authStore'

export default function SettingsPage() {
  const profile = useAuthStore((s) => s.profile)
  const user    = useAuthStore((s) => s.user)

  const [companyName,   setCompanyName]   = useState('Minha Marmoraria')
  const [slug,          setSlug]          = useState('minha-marmoraria')
  const [primaryColor,  setPrimaryColor]  = useState('#a78bfa')
  const [saved,         setSaved]         = useState(false)

  function handleSave() {
    // Fase 5+: salvar no Supabase via tenantsService
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <DashboardLayout>
      <div className="p-8 lg:p-12 max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-on-surface tracking-tight">Configurações</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Personalize sua empresa na plataforma Marmu.
          </p>
        </div>

        {/* Perfil da empresa */}
        <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-5">
          <h2 className="font-black text-on-surface text-base">Empresa</h2>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-background border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Slug Público (URL do configurador)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant bg-surface-container-highest border border-outline-variant rounded-l-xl px-3 py-3 whitespace-nowrap">
                marmu.app/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                className="flex-1 bg-background border border-outline-variant rounded-r-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-1.5">
              Seu cliente acessa o configurador em: <span className="text-primary">marmu.app/{slug}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
              Cor Primária da Marca
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-outline-variant cursor-pointer bg-transparent"
              />
              <div>
                <p className="text-sm font-medium text-on-surface">{primaryColor}</p>
                <p className="text-xs text-on-surface-variant">Usada nos botões do configurador público</p>
              </div>
              <div
                className="ml-auto w-16 h-8 rounded-lg border border-white/10"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>
        </section>

        {/* Plano atual */}
        <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-4">
          <h2 className="font-black text-on-surface text-base">Plano Atual</h2>
          <div className="flex items-center justify-between p-4 bg-primary-container/10 border border-primary/20 rounded-xl">
            <div>
              <p className="font-black text-primary text-lg">Trial Gratuito</p>
              <p className="text-xs text-on-surface-variant mt-0.5">14 dias · vence em breve</p>
            </div>
            <button className="px-4 py-2 bg-primary text-on-primary font-bold text-sm rounded-lg hover:bg-primary-fixed transition-colors">
              Assinar agora
            </button>
          </div>
          <p className="text-xs text-on-surface-variant">
            Integração Asaas disponível na Fase Asaas do desenvolvimento.
          </p>
        </section>

        {/* Conta do usuário */}
        <section className="bg-surface-container border border-outline-variant rounded-2xl p-6 space-y-4">
          <h2 className="font-black text-on-surface text-base">Minha Conta</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center">
              <span className="text-on-primary-container font-black text-lg">
                {profile?.name?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div>
              <p className="font-bold text-on-surface">{profile?.name || 'Usuário'}</p>
              <p className="text-sm text-on-surface-variant">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-container/30 text-primary border border-primary/20">
                {profile?.role ?? 'operator'}
              </span>
            </div>
          </div>
        </section>

        {/* Salvar */}
        <button
          onClick={handleSave}
          className={`w-full flex items-center justify-center gap-2 font-bold py-3.5 rounded-xl transition-all active:scale-95 ${
            saved
              ? 'bg-tertiary-container text-on-tertiary-container border border-tertiary/30'
              : 'bg-primary text-on-primary hover:bg-primary-fixed'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {saved ? 'check_circle' : 'save'}
          </span>
          {saved ? 'Salvo com sucesso!' : 'Salvar configurações'}
        </button>

      </div>
    </DashboardLayout>
  )
}
