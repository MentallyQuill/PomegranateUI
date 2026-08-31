import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  globalSetup: './tests/browser/global-setup.mjs',
  workers: 1,
  timeout: 120_000,
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}-snapshots/{arg}{ext}',
  use: {
    baseURL: 'http://127.0.0.1:4174',
    browserName: 'chromium',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
