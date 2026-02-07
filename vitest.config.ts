import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@islands': path.resolve(__dirname, './src/islands'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@firebase': path.resolve(__dirname, './src/firebase'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.astro', 'src/pages/**/*'],
    },
  },
});
