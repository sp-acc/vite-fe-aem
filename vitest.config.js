import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // suites build into shared tests/dist* folders, keep them serial
    fileParallelism: false,
    include: ['tests/**/*.test.js'],
  },
});
