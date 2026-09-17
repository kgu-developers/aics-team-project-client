import { resolve } from 'path';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin, type ProxyOptions } from 'vite';
import { defineConfig } from 'vitest/config';

const apiProxyPrefixes = [
  '/auth',
  '/api',
  '/announcements',
  '/edit-locks',
  '/meeting-actions',
  '/meeting-records',
  '/milestones',
  '/mid-reports',
  '/peer-evaluation-forms',
  '/sections',
  '/submissions',
  '/teams',
];

export function rewriteDevelopmentSetCookieHeaders(cookies?: string[]) {
  if (!cookies) return cookies;

  const issuedCsrfToken = cookies.some(cookie =>
    /^XSRF-TOKEN=[^;]/i.test(cookie),
  );

  return cookies
    .filter(cookie => !issuedCsrfToken || !/^XSRF-TOKEN=;/i.test(cookie))
    .map(cookie => cookie.replace(/;\s*Domain=kgudevelopers\.monster/gi, ''));
}

function createApiProxyOptions(proxyTarget: string): ProxyOptions {
  return {
    target: proxyTarget,
    changeOrigin: true,
    configure(proxy) {
      proxy.on('proxyRes', proxyResponse => {
        const cookies = rewriteDevelopmentSetCookieHeaders(
          proxyResponse.headers['set-cookie'],
        );
        if (cookies) proxyResponse.headers['set-cookie'] = cookies;
      });
    },
    secure: true,
  };
}

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
  const apiProxy = proxyTarget
    ? Object.fromEntries(
        apiProxyPrefixes.map(prefix => [
          prefix,
          createApiProxyOptions(proxyTarget),
        ]),
      )
    : {};

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
      include: ['src/**/*.test.{ts,tsx}', 'vite.config.test.ts'],
      env: { VITE_ENABLE_MSW: 'true' },
      environment: 'jsdom',
      // jsdom, MSW, and mutable demo fixtures make the integration-heavy suite
      // CPU-bound. Limit parallel workers so interaction tests do not time out
      // only when the complete suite runs.
      pool: 'forks',
      maxWorkers: 2,
      minWorkers: 1,
      testTimeout: 15_000,
      setupFiles: './src/test/setup.ts',
    },
  };
});
