import { resolve } from 'path';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const apiProxyPrefixes = [
  '/api',
  '/announcements',
  '/meeting-actions',
  '/meeting-records',
  '/sections',
  '/teams',
];

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

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_');
  const proxyTarget = env.VITE_API_PROXY_TARGET;
  const apiProxy = Object.fromEntries(
    apiProxyPrefixes.map(prefix => [
      prefix,
      {
        target: proxyTarget,
        changeOrigin: true,
        secure: true,
      },
    ]),
  );

  return {
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
    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,
      ...(command === 'serve' && proxyTarget
        ? {
            proxy: {
              ...apiProxy,
            },
          }
        : {}),
    },
    test: {
      env: { VITE_ENABLE_MSW: 'true' },
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
