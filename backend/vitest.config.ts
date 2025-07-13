import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/server.ts',
        '**/*.d.ts',
        'tests/',
        'coverage/',
      ],
      threshold: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    timeout: 45000,
    setupFiles: ['src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git'],
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/../shared',
    },
  },
});