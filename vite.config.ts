import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Sur Vercel, l'URL publique du site est déduite du domaine de production du projet
// si VITE_SITE_URL n'est pas définie (canonical, Open Graph, sitemap).
if (!process.env.VITE_SITE_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.VITE_SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    rolldownOptions: {
      output: {
        // Le client Supabase est volumineux et stable : un fichier dédié, mis en cache longtemps.
        codeSplitting: {
          groups: [
            { name: 'supabase', test: /node_modules[/\\]@supabase/ },
            { name: 'react', test: /node_modules[/\\](react|react-dom|react-router|scheduler)[/\\]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      VITE_SITE_URL: 'https://www.example.test',
    },
  },
})
