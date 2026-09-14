const path = require('node:path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: 'fonte',
  build: {
    outDir: path.resolve(__dirname, 'alvo'),
    emptyOutDir: true
  }
});
