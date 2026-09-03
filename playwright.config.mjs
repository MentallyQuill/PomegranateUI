import { defineConfig } from '@playwright/test';
import { resolveBrowserServerPort } from './tests/browser/global-setup.mjs';

const browserServerPort = resolveBrowserServerPort();

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/browser/global-setup.mjs',
  workers: 1,
  timeout: 120_000,
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}-snapshots/{arg}{ext}',
  use: {
    baseURL: `http://127.0.0.1:${browserServerPort}`,
    browserName: 'chromium',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
