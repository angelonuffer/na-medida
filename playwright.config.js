const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './testes',
  reporter: [['html', { open: process.env.CI ? 'never' : 'always' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: process.env.CI ? 'retain-on-failure' : 'on',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
