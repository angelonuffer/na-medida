const path = require('node:path');
const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');
const { VitePWA } = require('vite-plugin-pwa');

module.exports = defineConfig({
  root: 'fonte',
  base: process.env.GITHUB_ACTIONS ? '/na-medida/' : '/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Na Medida',
        short_name: 'Na Medida',
        description: 'Acompanhe alimentos e consumo na medida certa.',
        theme_color: '#2c3e50',
        background_color: '#f4f6f8',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: '.',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html'
      }
    })
  ],
  build: {
    outDir: path.resolve(__dirname, 'alvo'),
    emptyOutDir: true
  }
});
