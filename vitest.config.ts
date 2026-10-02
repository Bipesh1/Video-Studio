import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'shared/**/*.test.ts',
      'engine/**/*.test.ts',
      'engine/**/*.test.tsx',
      'cli/**/*.test.ts',
    ],
    environment: 'node',
  },
});
