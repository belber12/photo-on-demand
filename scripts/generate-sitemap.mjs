/**
 * Генератор sitemap.xml
 * Запуск: npm run sitemap
 * Добавляет все опубликованные статьи блога к статическому sitemap.
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import 'dotenv/config'

const BASE_URL = 'https://fotostudiozakaz.ru'
const TODAY = new Date().toISOString().split('T')[0]

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
)

const STATIC_URLS = [
  { loc: '/',           priority: '1.0', changefreq: 'weekly' },
  { loc: '/#portfolio', priority: '0.9', changefreq: 'weekly' },
  { loc: '/#pricing',   priority: '0.9', changefreq: 'monthly' },
  { loc: '/#services',  priority: '0.8', changefreq: 'monthly' },
  { loc: '/#faq',       priority: '0.7', changefreq: 'monthly' },
  { loc: '/blog',       priority: '0.8', changefreq: 'weekly' },
]

async function generate() {
  console.log('Fetching blog articles from Supabase...')

  const { data: articles, error } = await supabase
    .from('blog_articles')
    .select('slug, updated_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase error:', error.message)
    process.exit(1)
  }

  console.log(`Found ${articles.length} published articles`)

  const urls = [
    ...STATIC_URLS.map(u => ({
      loc: `${BASE_URL}${u.loc}`,
      lastmod: TODAY,
      changefreq: u.changefreq,
      priority: u.priority,
    })),
    ...articles.map(art => ({
      loc: `${BASE_URL}/blog/${art.slug}`,
      lastmod: art.updated_at?.split('T')[0] ?? TODAY,
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`

  const outPath = resolve('public/sitemap.xml')
  writeFileSync(outPath, xml, 'utf-8')
  console.log(`✓ sitemap.xml updated: ${urls.length} URLs → ${outPath}`)
}

generate()
