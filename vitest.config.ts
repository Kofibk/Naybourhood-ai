import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      '__tests__/unit/**/*.test.ts',
      'tests/**/*.test.tsx',
      'tests/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['lib/scoring/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
