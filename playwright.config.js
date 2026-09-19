const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './testes',
  snapshotPathTemplate: '{testDir}/telas/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
