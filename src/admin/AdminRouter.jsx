import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/LoginPage'
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ContentPage   = lazy(() => import('./pages/ContentPage'))
const PricingPage   = lazy(() => import('./pages/PricingPage'))
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'))
const BlogPage      = lazy(() => import('./pages/BlogPage'))
const BlogEditPage  = lazy(() => import('./pages/BlogEditPage'))
const LeadsPage     = lazy(() => import('./pages/LeadsPage'))

function AdminFallback() {
  return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
}

export default function AdminRouter() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="content" element={<ContentPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="portfolio" element={<PortfolioPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/new" element={<BlogEditPage />} />
            <Route path="blog/:id" element={<BlogEditPage />} />
            <Route path="leads" element={<LeadsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  )
}
