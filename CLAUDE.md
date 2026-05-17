# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for **Фото на заказ** — a Russian-language professional photo studio platform ([fotostudiozakaz.ru](https://fotostudiozakaz.ru)). Contains a React landing site, admin panel, Photoshop UXP plugin, Node.js backend, and Python retouching CLI.

## Commands

### Frontend (root)
```bash
npm run dev       # Dev server at localhost:5173 (host 0.0.0.0)
npm run build     # Production build to dist/
npm run lint      # ESLint (flat config)
npm run preview   # Preview built output
npm run sitemap   # Generate sitemap via scripts/generate-sitemap.mjs
```

### Backend (Photoshop plugin API)
```bash
cd backend && npm run dev    # Express server on port 8787
```

### Python product retouching
```bash
cd product_retouch
pip install -r requirements.txt
python retouch_product.py path/to/photo.png
```

### Supabase
```bash
supabase start           # Local Supabase instance
supabase db push         # Apply migrations
supabase functions serve # Run edge functions locally
```

## Architecture

### Frontend (`src/`)

Single-page app with React Router 7. Two main route trees:

- `/` and public pages → `App.jsx` (landing page, ~125KB) + `pages/BlogListPage.jsx`, `pages/BlogPostPage.jsx`
- `/admin/*` → `admin/AdminRouter.jsx` → `admin/pages/` (protected by `ProtectedRoute`)

**Data layer:** `lib/supabase.js` initialises the Supabase client and fetches portfolio images via RPC with a 1-hour localStorage cache. Admin pages use custom hooks in `admin/hooks/` (`useAuth`, `useSiteContent`, `useBlogArticles`).

**Styling:** Tailwind CSS with a dark theme. Custom colour tokens defined in `tailwind.config.js` (`bg-primary`, `bg-secondary`, `accent`). Animations via Framer Motion.

**Key UI components** in `src/components/ui/`:
- `shape-landing-hero.jsx` — animated hero section
- `ai-prompt-box.jsx` — AI prompt input with Framer Motion effects
- `spotlight-card.jsx` — glow/spotlight card used in Features section

### Backend (`backend/`)

Express server that bridges the Photoshop plugin to Replicate AI models. Runs on port 8787.

### Photoshop Plugin (`plugin/`)

Adobe UXP plugin. UI defined in `index.html`/`styles.css`, logic in `main.js`. Calls the backend API for AI generation.

### Python CLI (`product_retouch/`)

`retouch_product.py` removes backgrounds (via `rembg`), adds studio shadow, and outputs ready-for-e-commerce images.

### Database (`supabase/`)

PostgreSQL via Supabase with RLS policies. Tables: `leads`, `blog_articles`, `site_content`, admin roles. An RPC function `list_portfolio_files_fn` lists portfolio storage files. Edge function `notify-lead` sends webhook notifications for new leads.

## Environment Variables

Frontend uses Vite env vars (prefix `VITE_`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Deployment

Hosted on Netlify (`netlify.toml`). Build command: `npm run build`, publish dir: `dist/`. Netlify Image CDN is enabled for portfolio images. `/admin/*` routes are never cached.
