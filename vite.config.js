const path = require('node:path');
const { defineConfig } = require('vite');
const { svelte } = require('@sveltejs/vite-plugin-svelte');

module.exports = defineConfig({
  root: 'fonte',
  plugins: [svelte()],
  build: {
    outDir: path.resolve(__dirname, 'alvo'),
    emptyOutDir: true
  }
});
