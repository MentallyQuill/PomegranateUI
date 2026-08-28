import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node scripts/serve-static.mjs --root . --port 4173',
    url: 'http://127.0.0.1:4173/prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html',
    reuseExistingServer: false,
    timeout: 15_000
  }
});
