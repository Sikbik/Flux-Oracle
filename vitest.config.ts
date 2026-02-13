import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@fpho/core': path.resolve(__dirname, 'packages/core/src/index.ts'),
      '@fpho/venues': path.resolve(__dirname, 'packages/venues/src/index.ts'),
      '@fpho/ingestor': path.resolve(__dirname, 'packages/ingestor/src/index.ts'),
      '@fpho/aggregator': path.resolve(__dirname, 'packages/aggregator/src/index.ts'),
      '@fpho/api': path.resolve(__dirname, 'packages/api/src/index.ts'),
      '@fpho/cli': path.resolve(__dirname, 'packages/cli/src/index.ts'),
      '@fpho/p2p': path.resolve(__dirname, 'packages/p2p/src/index.ts'),
      '@fpho/reporter': path.resolve(__dirname, 'packages/reporter/src/index.ts'),
      '@fpho/anchor': path.resolve(__dirname, 'packages/anchor/src/index.ts'),
      '@fpho/indexer': path.resolve(__dirname, 'packages/indexer/src/index.ts')
    }
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts']
    }
  }
});
