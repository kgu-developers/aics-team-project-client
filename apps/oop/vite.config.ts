import { resolve } from 'path';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

function rejectProductionRouterDevtools(): Plugin {
  return {
    name: 'reject-production-router-devtools',
    apply: 'build',
    generateBundle(_options, bundle) {
      const devtoolsChunks = Object.values(bundle)
        .filter(output => output.type === 'chunk')
        .filter(chunk =>
          Object.keys(chunk.modules).some(moduleId =>
            moduleId.includes('@tanstack/router-devtools'),
          ),
        )
        .map(chunk => chunk.fileName);

      if (devtoolsChunks.length > 0) {
        this.error(
          `Production bundle contains TanStack Router Devtools: ${devtoolsChunks.join(', ')}`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    tanstackRouter({
      routesDirectory: './src/app/routes',
      generatedRouteTree: './src/app/routeTree.gen.ts',
    }),
    react(),
    vanillaExtractPlugin(),
    rejectProductionRouterDevtools(),
  ],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
  envPrefix: 'VITE_',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
