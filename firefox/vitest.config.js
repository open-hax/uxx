import { defineConfig } from 'vitest/config';
export default defineConfig({
  // Diagnostic-build flag (see vite.config.*.js); production/test = false.
  define: { __UXX_DIAG__: false },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    setupFiles: ['tests/setup.js'],
  },
});
