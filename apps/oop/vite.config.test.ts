// @vitest-environment node

import { fileURLToPath } from 'node:url';

import type { ResolvedConfig } from 'vite';
import { resolveConfig } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

const appRoot = fileURLToPath(new URL('.', import.meta.url));
const configFile = fileURLToPath(new URL('./vite.config.ts', import.meta.url));

let developmentConfig: ResolvedConfig;
let proxiedDevelopmentConfig: ResolvedConfig;

beforeAll(async () => {
  const previousProxyTarget = process.env.VITE_API_PROXY_TARGET;
  process.env.VITE_API_PROXY_TARGET = '';
  developmentConfig = await resolveConfig(
    {
      configFile,
      mode: 'development',
      root: appRoot,
    },
    'serve',
  );
  process.env.VITE_API_PROXY_TARGET =
    'https://team-project-api.kgudevelopers.monster';
  proxiedDevelopmentConfig = await resolveConfig(
    {
      configFile,
      mode: 'development',
      root: appRoot,
    },
    'serve',
  );

  if (previousProxyTarget === undefined) {
    delete process.env.VITE_API_PROXY_TARGET;
  } else {
    process.env.VITE_API_PROXY_TARGET = previousProxyTarget;
  }
});

describe('OOP development server config', () => {
  it('keeps pnpm dev on HTTP localhost:5173 without a backend proxy', () => {
    expect(developmentConfig.server.host).toBe('localhost');
    expect(developmentConfig.server.port).toBe(5173);
    expect(developmentConfig.server.strictPort).toBe(true);
    expect(developmentConfig.server.https).toBeUndefined();
    expect(developmentConfig.server.proxy).toBeUndefined();
  });

  it('can proxy every Swagger API root only in development serve mode', () => {
    expect(Object.keys(proxiedDevelopmentConfig.server.proxy ?? {})).toEqual([
      '/api',
      '/announcements',
      '/meeting-actions',
      '/meeting-records',
      '/sections',
      '/teams',
    ]);
    expect(proxiedDevelopmentConfig.server.proxy).toMatchObject(
      Object.fromEntries(
        [
          '/api',
          '/announcements',
          '/meeting-actions',
          '/meeting-records',
          '/sections',
          '/teams',
        ].map(prefix => [
          prefix,
          {
            target: 'https://team-project-api.kgudevelopers.monster',
            changeOrigin: true,
            secure: true,
          },
        ]),
      ),
    );
  });

  it('does not install development HTTPS or host-guard plugins', () => {
    const pluginNames = developmentConfig.plugins.map(plugin => plugin.name);

    expect(pluginNames).not.toContain('vite:basic-ssl');
    expect(pluginNames).not.toContain('aics-hybrid-server-host-guard');
    expect(pluginNames).not.toContain('aics-deployed-server-host-guard');
  });
});
