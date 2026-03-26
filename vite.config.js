import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, join } from 'path'
import { readdirSync } from 'fs'

// Плагин: инлайнит CSS в HTML чтобы убрать блокирующий сетевой запрос
function inlineCssPlugin() {
  return {
    name: 'inline-css',
    apply: 'build',
    closeBundle() {
      const distDir = resolve('dist')
      const assetsDir = join(distDir, 'assets')

      let cssFile
      try {
        cssFile = readdirSync(assetsDir).find(f => f.endsWith('.css'))
      } catch {
        return
      }
      if (!cssFile) return

      const css = readFileSync(join(assetsDir, cssFile), 'utf-8')
      const htmlPath = join(distDir, 'index.html')
      let html = readFileSync(htmlPath, 'utf-8')

      // Заменяем <link ... rel="stylesheet" ...> на <style>...</style>
      // Vite 7 может ставить crossorigin до rel, поэтому ищем <link> с rel="stylesheet" в любом порядке
      html = html.replace(
        /<link[^>]+rel="stylesheet"[^>]*>/,
        `<style>${css}</style>`
      )

      writeFileSync(htmlPath, html)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      jpg: { quality: 78 },
      jpeg: { quality: 78 },
      png: { quality: 78 },
      webp: { quality: 78 },
    }),
    inlineCssPlugin(),
  ],
})
