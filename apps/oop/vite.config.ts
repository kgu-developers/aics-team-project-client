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

const loopbackProxyHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

export function normalizeApiProxyTarget(proxyTarget: string) {
  let target: URL;
  try {
    target = new URL(proxyTarget);
  } catch {
    throw new Error('VITE_API_PROXY_TARGET must be a valid URL');
  }

  if (target.username || target.password) {
    throw new Error('VITE_API_PROXY_TARGET must not include credentials');
  }
  if (
    target.protocol !== 'https:' &&
    !(target.protocol === 'http:' && loopbackProxyHosts.has(target.hostname))
  ) {
    throw new Error(
      'VITE_API_PROXY_TARGET must use HTTPS or an HTTP loopback origin',
    );
  }
  if (target.pathname !== '/' || target.search || target.hash) {
    throw new Error('VITE_API_PROXY_TARGET must be an origin without a path');
  }

  return target.origin;
}

function createApiProxyOptions(proxyTarget: string): ProxyOptions {
  return {
    target: normalizeApiProxyTarget(proxyTarget),
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
      // CPU-bound. Run files sequentially: on Windows, launching a second forks
      // worker can time out before it responds and yield unhandled test errors.
      pool: 'forks',
      maxWorkers: 1,
      minWorkers: 1,
      testTimeout: 15_000,
      setupFiles: './src/test/setup.ts',
    },
  };
});
