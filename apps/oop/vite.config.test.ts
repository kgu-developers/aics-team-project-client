// @vitest-environment node

import { fileURLToPath } from 'node:url';

import type { ResolvedConfig } from 'vite';
import { resolveConfig } from 'vite';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  normalizeApiProxyTarget,
  rewriteDevelopmentSetCookieHeaders,
} from './vite.config';

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
}, 30_000);

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
    ]);
    expect(proxiedDevelopmentConfig.server.proxy).toMatchObject(
      Object.fromEntries(
        [
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
        ].map(prefix => [
          prefix,
          {
            target: 'https://team-project-api.kgudevelopers.monster',
            changeOrigin: true,
            configure: expect.any(Function),
            secure: true,
          },
        ]),
      ),
    );
  });

  it('accepts HTTPS and explicit HTTP loopback proxy origins', () => {
    expect(normalizeApiProxyTarget('https://api.example.test')).toBe(
      'https://api.example.test',
    );
    expect(normalizeApiProxyTarget('http://localhost:8080')).toBe(
      'http://localhost:8080',
    );
    expect(normalizeApiProxyTarget('http://127.0.0.1:8080')).toBe(
      'http://127.0.0.1:8080',
    );
    expect(normalizeApiProxyTarget('http://[::1]:8080')).toBe(
      'http://[::1]:8080',
    );
  });

  it.each([
    'http://api.example.test',
    'ftp://api.example.test',
    'https://user:password@api.example.test',
    'https://api.example.test/v1',
    'https://api.example.test?tenant=oop',
    'not-a-url',
  ])('rejects unsafe API proxy target %s', proxyTarget => {
    expect(() => normalizeApiProxyTarget(proxyTarget)).toThrow(
      /VITE_API_PROXY_TARGET/,
    );
  });

  it('rewrites the shared-domain CSRF cookie for localhost without applying the deletion cookie over it', () => {
    expect(
      rewriteDevelopmentSetCookieHeaders([
        'XSRF-TOKEN=issued-token; Domain=kgudevelopers.monster; Path=/; Secure',
        'XSRF-TOKEN=; Path=/; Max-Age=0; Secure; SameSite=Lax',
        'refreshToken=refresh-token; Path=/; Secure; HttpOnly',
      ]),
    ).toEqual([
      'XSRF-TOKEN=issued-token; Path=/; Secure',
      'refreshToken=refresh-token; Path=/; Secure; HttpOnly',
    ]);
  });

  it('does not install development HTTPS or host-guard plugins', () => {
    const pluginNames = developmentConfig.plugins.map(plugin => plugin.name);

    expect(pluginNames).not.toContain('vite:basic-ssl');
    expect(pluginNames).not.toContain('aics-hybrid-server-host-guard');
    expect(pluginNames).not.toContain('aics-deployed-server-host-guard');
  });
});
