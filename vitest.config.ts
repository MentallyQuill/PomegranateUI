import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
      'examples/**/*.test.ts',
      'examples/**/*.test.tsx'
    ],
    setupFiles: ['./tests/native/setup.ts']
  }
});
