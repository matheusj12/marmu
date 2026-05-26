import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './lib/threePatch'
import './index.css'

import ProtectedRoute from './features/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

// Inicializa auth na raiz — garante que setLoading(false) rode em qualquer rota
function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuth()
  return <>{children}</>
}

// Auth pages
const LoginPage        = lazy(() => import('./app/auth/LoginPage'))
const RegisterPage     = lazy(() => import('./app/auth/RegisterPage'))
const ForgotPassword   = lazy(() => import('./app/auth/ForgotPasswordPage'))

// Dashboard pages
const DashboardPage    = lazy(() => import('./app/dashboard/DashboardPage'))
const ConfiguratorPage = lazy(() => import('./app/dashboard/ConfiguratorPage'))
const MaterialsPage    = lazy(() => import('./app/dashboard/MaterialsPage'))
const QuotesPage       = lazy(() => import('./app/dashboard/QuotesPage'))
const SettingsPage     = lazy(() => import('./app/dashboard/SettingsPage'))
const AdminPage        = lazy(() => import('./app/dashboard/AdminPage'))
const QuoteDetailPage  = lazy(() => import('./app/dashboard/QuoteDetailPage'))

// Demo pública (versão original do configurador)
const App = lazy(() => import('./App'))

// Configurador público por tenant slug
const PublicConfiguratorPage = lazy(() => import('./app/public/PublicConfiguratorPage'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthInitializer>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Públicas */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Demo pública do configurador */}
        <Route path="/demo"            element={<App />} />

        {/* Área protegida — qualquer usuário autenticado */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"                    element={<DashboardPage />} />
          <Route path="/dashboard/new"                element={<ConfiguratorPage />} />
          <Route path="/dashboard/orcamentos"         element={<QuotesPage />} />
          <Route path="/dashboard/orcamentos/:id"    element={<QuoteDetailPage />} />
          <Route path="/dashboard/materiais"          element={<MaterialsPage />} />
          <Route path="/dashboard/configuracoes"      element={<SettingsPage />} />
        </Route>

        {/* Área master — apenas role=master */}
        <Route element={<ProtectedRoute requiredRole="master" />}>
          <Route path="/dashboard/admin" element={<AdminPage />} />
        </Route>

        {/* Configurador público — /:slug (deve ficar antes do catch-all) */}
        <Route path="/:slug" element={<PublicConfiguratorPage />} />

        {/* Redireciona raiz para login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
    </AuthInitializer>
  </BrowserRouter>,
)
