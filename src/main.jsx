import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
const App         = lazy(() => import('./App.jsx'))
const AdminRouter = lazy(() => import('./admin/AdminRouter.jsx'))
const BlogListPage = lazy(() => import('./pages/BlogListPage.jsx'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Suspense>
          <Routes>
            <Route path="/admin/*" element={<AdminRouter />} />
            <Route path="/blog" element={<BlogListPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
