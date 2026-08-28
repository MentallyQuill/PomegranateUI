import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser']
  },
  test: {
    environment: 'jsdom',
    include: [
      'packages/**/*.test.ts',
      'apps/**/*.test.ts',
      'examples/**/*.test.ts',
    ],
    setupFiles: ['./tests/native/setup.ts']
  }
});
