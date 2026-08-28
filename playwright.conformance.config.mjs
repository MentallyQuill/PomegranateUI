import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config.mjs';

export default defineConfig(baseConfig, {
  testDir: './tests/conformance/specs',
  outputDir: './test-results/playwright-conformance',
  reporter: [['line']]
});
