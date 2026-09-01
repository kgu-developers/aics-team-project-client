import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import {
  canonicalizePath,
  discoverDocumentEntries,
  getCacheStatus,
  normalizeOpenApiDocuments,
  refreshOpenApi,
  validateOpenApiDocument,
  validateSource,
} from './openapi-contract.mjs';

const sentinelToken = 'sentinel-openapi-bearer-token';
const sentinelBody = 'sentinel-upstream-error-body';
const sentinelUrl = 'https://sentinel.invalid/private/openapi';

let primaryServer;
let primaryUrl;
let primaryMode = 'valid';
let secondaryServer;
let secondaryUrl;

const fixtureDocument = (title, operationId = 'listMembers') => ({
  openapi: '3.0.3',
  info: { title, version: '1.0.0' },
  components: {
    schemas: {
      TeamUpdate: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', enum: ['ALPHA', 'BETA'] },
          nickname: { type: ['string', 'null'] },
        },
      },
    },
  },
  paths: {
    '/teams/{teamId}/members/{memberId}': {
      parameters: [
        {
          name: 'teamId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      get: {
        operationId,
        tags: ['teams'],
        parameters: [
          {
            name: 'memberId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'ok',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { name: { type: 'string' } },
                },
                example: { name: 'ignored-example' },
              },
            },
          },
          401: { description: 'unauthorized' },
        },
      },
    },
    '/teams/{teamId}': {
      post: {
        operationId: 'updateTeam',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TeamUpdate' },
            },
          },
        },
        responses: { 204: { description: 'updated' } },
      },
    },
  },
});

function sendJson(response, value, status = 200) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(value));
}

function startServer(handler) {
  return new Promise((resolve, reject) => {
    const server = createServer(handler);
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.removeListener('error', reject);
      resolve(server);
    });
  });
}

function serverOrigin(server) {
  const address = server.address();
  assert.equal(typeof address, 'object');
  return `http://127.0.0.1:${address.port}`;
}

async function stopServer(server) {
  if (!server) return;
  await new Promise(resolve => server.close(resolve));
}

async function createTestWorkspace(name) {
  const root = await mkdtemp(join(tmpdir(), `openapi-contract-${name}-`));
  const sourcePath = join(root, 'sources', 'openapi-source.json');
  const cacheDir = join(root, 'cache');
  await mkdir(join(root, 'sources'), { recursive: true });
  await writeSource(sourcePath);
  return { root, sourcePath, cacheDir };
}

async function writeSource(sourcePath, overrides = {}) {
  const source = {
    schemaVersion: 1,
    sourceId: 'loopback-fixture',
    swaggerUiUrl: `${primaryUrl ?? sentinelUrl}/swagger-ui/index.html#/`,
    targetEnvironment: 'test',
    freshness: { maxAgeSeconds: 3600 },
    auth: { kind: 'none' },
    ...overrides,
  };
  await writeFile(sourcePath, JSON.stringify(source, null, 2));
}

before(async () => {
  primaryServer = await startServer((request, response) => {
    if (request.url === '/v3/api-docs/swagger-config') {
      if (primaryMode === 'redirect-cross-origin') {
        response.writeHead(302, {
          location: `${secondaryUrl}/external-config`,
        });
        response.end();
        return;
      }
      if (primaryMode === 'error') {
        response.writeHead(500, { 'content-type': 'text/plain' });
        response.end(sentinelBody);
        return;
      }
      if (primaryMode === 'non-json') {
        response.writeHead(200, { 'content-type': 'text/html' });
        response.end('<html>not a swagger document</html>');
        return;
      }
      if (primaryMode === 'signed-entry') {
        sendJson(response, {
          urls: [
            {
              name: 'signed',
              url: `/v3/api-docs/public?X-Amz-Credential=${sentinelToken}`,
            },
          ],
        });
        return;
      }
      sendJson(response, {
        urls: [
          { name: 'public', url: '/v3/api-docs/public' },
          { name: 'admin', url: '/v3/api-docs/admin' },
        ],
      });
      return;
    }
    if (request.url === '/v3/api-docs/public') {
      if (primaryMode === 'stalled-body') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.write('{');
        return;
      }
      sendJson(response, fixtureDocument('Public API'));
      return;
    }
    if (request.url === '/v3/api-docs/admin') {
      sendJson(response, fixtureDocument('Admin API', 'listAdminMembers'));
      return;
    }
    if (request.url === '/external-config') {
      sendJson(response, { urls: [] });
      return;
    }
    response.writeHead(404);
    response.end();
  });
  primaryUrl = serverOrigin(primaryServer);
  secondaryServer = await startServer((request, response) => {
    if (request.url === '/external-config') sendJson(response, { urls: [] });
    else response.writeHead(404).end();
  });
  secondaryUrl = serverOrigin(secondaryServer);
});

after(async () => {
  await stopServer(primaryServer);
  await stopServer(secondaryServer);
});

test('refresh discovers SpringDoc groups and stores a normalized operation index', async () => {
  primaryMode = 'valid';
  const workspace = await createTestWorkspace('groups');
  const result = await refreshOpenApi(workspace);

  assert.equal(result.state, 'fresh');
  assert.equal(result.metadata.documentCount, 2);
  assert.equal(result.metadata.operationCount, 4);
  assert.equal(result.latest.documents.length, 2);
  assert.deepEqual(
    result.latest.documents.map(document => document.group),
    ['admin', 'public'],
  );
  assert.ok(
    result.latest.operations.some(
      operation =>
        operation.group === 'admin' &&
        operation.canonicalPath === '/teams/{}/members/{}' &&
        operation.method === 'get',
    ),
  );
  const updateOperation = result.latest.operations.find(
    operation => operation.operationId === 'updateTeam',
  );
  assert.equal(
    updateOperation.source.jsonPointer,
    '/paths/~1teams~1{teamId}/post',
  );
  assert.match(updateOperation.source.documentHash, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    updateOperation.request.content[0].schema.resolved.required,
    ['name'],
  );
  assert.deepEqual(
    updateOperation.request.content[0].schema.resolved.properties.name.enum,
    ['ALPHA', 'BETA'],
  );
  assert.deepEqual(
    updateOperation.request.content[0].schema.resolved.properties.nickname.type,
    ['string', 'null'],
  );
  assert.equal((await readdir(join(workspace.cacheDir, 'raw'))).length, 2);
  assert.equal(
    (await readdir(join(workspace.cacheDir, 'normalized'))).length,
    1,
  );
});

test('canonicalization and normalized index are stable regardless of object insertion order', () => {
  assert.equal(
    canonicalizePath('/teams/{teamId}/members/{memberId}'),
    '/teams/{}/members/{}',
  );
  assert.equal(canonicalizePath('/teams/:teamId/'), '/teams/{}');
  const first = fixtureDocument('Stable API');
  const second = {
    components: structuredClone(first.components),
    paths: {
      '/teams/{teamId}': structuredClone(first.paths['/teams/{teamId}']),
      '/teams/{teamId}/members/{memberId}': structuredClone(
        first.paths['/teams/{teamId}/members/{memberId}'],
      ),
    },
    info: { ...first.info, title: 'Changed documentation title' },
    openapi: first.openapi,
  };
  second.paths['/teams/{teamId}/members/{memberId}'].get.responses[
    '200'
  ].description = 'changed documentation only';
  second.paths['/teams/{teamId}/members/{memberId}'].get.responses[
    '200'
  ].content['application/json'].example = { name: 'changed-example' };
  const firstIndex = normalizeOpenApiDocuments([
    { group: 'public', document: first, documentHash: 'a'.repeat(64) },
  ]);
  const secondIndex = normalizeOpenApiDocuments([
    { group: 'public', document: second, documentHash: 'b'.repeat(64) },
  ]);

  assert.equal(firstIndex.normalizedHash, secondIndex.normalizedHash);
  assert.deepEqual(
    firstIndex.operations.map(operation => ({
      ...operation,
      source: undefined,
    })),
    secondIndex.operations.map(operation => ({
      ...operation,
      source: undefined,
    })),
  );
  assert.ok(
    firstIndex.operations.some(
      operation => operation.canonicalPath === '/teams/{}',
    ),
  );
  const requiredChanged = structuredClone(first);
  requiredChanged.components.schemas.TeamUpdate.required = [];
  const requiredChangedIndex = normalizeOpenApiDocuments([
    {
      group: 'public',
      document: requiredChanged,
      documentHash: 'c'.repeat(64),
    },
  ]);
  assert.notEqual(
    firstIndex.normalizedHash,
    requiredChangedIndex.normalizedHash,
  );
});

test('external and unresolved document references are rejected', () => {
  const external = fixtureDocument('External reference');
  external.paths['/teams/{teamId}'].post.requestBody.content[
    'application/json'
  ].schema = { $ref: 'https://example.com/schema.json' };
  assert.throws(
    () => validateOpenApiDocument(external),
    error => error.code === 'REFERENCE_INVALID',
  );

  const unresolved = fixtureDocument('Unresolved reference');
  unresolved.paths['/teams/{teamId}'].post.requestBody.content[
    'application/json'
  ].schema = { $ref: '#/components/schemas/Missing' };
  assert.throws(
    () => validateOpenApiDocument(unresolved),
    error => error.code === 'REFERENCE_INVALID',
  );
});

test('cross-origin redirects are rejected before following the location', async () => {
  primaryMode = 'redirect-cross-origin';
  const workspace = await createTestWorkspace('redirect');
  const result = await refreshOpenApi(workspace);

  assert.equal(result.state, 'unavailable');
  assert.equal(result.error.code, 'CROSS_ORIGIN_REDIRECT');
  assert.equal(result.preserved, false);
  assert.equal(getCacheStatus(workspace).state, 'unavailable');
  const metadata = await readFile(
    join(workspace.cacheDir, 'metadata.json'),
    'utf8',
  );
  assert.match(metadata, /CROSS_ORIGIN_REDIRECT/);
  assert.doesNotMatch(
    metadata,
    new RegExp(secondaryUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
});

test('a failed refresh preserves the last valid latest and raw cache', async () => {
  primaryMode = 'valid';
  const workspace = await createTestWorkspace('preserve');
  const first = await refreshOpenApi(workspace);
  const latestBefore = await readFile(
    join(workspace.cacheDir, 'latest.json'),
    'utf8',
  );
  const rawBefore = await Promise.all(
    (await readdir(join(workspace.cacheDir, 'raw'))).map(async name => [
      name,
      await readFile(join(workspace.cacheDir, 'raw', name), 'utf8'),
    ]),
  );

  primaryMode = 'non-json';
  const second = await refreshOpenApi(workspace);
  assert.equal(first.state, 'fresh');
  assert.equal(second.state, 'stale');
  assert.equal(second.error.code, 'NON_JSON_CONTENT');
  assert.equal(second.preserved, true);
  assert.equal(
    await readFile(join(workspace.cacheDir, 'latest.json'), 'utf8'),
    latestBefore,
  );
  const rawAfter = await Promise.all(
    (await readdir(join(workspace.cacheDir, 'raw'))).map(async name => [
      name,
      await readFile(join(workspace.cacheDir, 'raw', name), 'utf8'),
    ]),
  );
  assert.deepEqual(rawAfter, rawBefore);
});

test('the atomic current manifest remains authoritative over torn legacy mirrors', async () => {
  primaryMode = 'valid';
  const workspace = await createTestWorkspace('atomic-current');
  const first = await refreshOpenApi(workspace);
  await writeFile(join(workspace.cacheDir, 'latest.json'), '{broken');
  await writeFile(join(workspace.cacheDir, 'metadata.json'), '{broken');

  assert.equal(first.state, 'fresh');
  assert.equal(getCacheStatus(workspace).state, 'fresh');

  primaryMode = 'non-json';
  const failed = await refreshOpenApi(workspace);
  assert.equal(failed.state, 'stale');
  assert.equal(failed.preserved, true);
  assert.equal(getCacheStatus(workspace).state, 'stale');
});

test('bearer env values, source URLs, and upstream error bodies never enter metadata or status output', async () => {
  primaryMode = 'error';
  const workspace = await createTestWorkspace('redaction');
  await writeSource(workspace.sourcePath, {
    auth: { kind: 'bearer-env', envName: 'OPENAPI_TEST_TOKEN' },
  });
  const result = await refreshOpenApi({
    ...workspace,
    env: { OPENAPI_TEST_TOKEN: sentinelToken },
  });
  assert.equal(result.error.code, 'HTTP_ERROR');
  const metadata = await readFile(
    join(workspace.cacheDir, 'metadata.json'),
    'utf8',
  );
  const status = JSON.stringify(getCacheStatus(workspace));
  assert.doesNotMatch(metadata, new RegExp(sentinelToken));
  assert.doesNotMatch(metadata, new RegExp(sentinelBody));
  assert.doesNotMatch(
    metadata,
    new RegExp(sentinelUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
  assert.doesNotMatch(status, new RegExp(sentinelToken));
  assert.doesNotMatch(status, new RegExp(sentinelBody));
  assert.doesNotMatch(
    status,
    new RegExp(sentinelUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  );
});

test('source validation rejects embedded and query credentials', () => {
  assert.throws(
    () =>
      validateSource({
        sourceId: 'bad-url',
        swaggerUiUrl: 'https://user:password@example.com/swagger-ui/index.html',
        targetEnvironment: 'test',
      }),
    error => error.code === 'SOURCE_URL_CREDENTIALS',
  );
  assert.throws(
    () =>
      validateSource({
        sourceId: 'bad-query',
        swaggerUiUrl:
          'https://example.com/swagger-ui/index.html?access_token=secret',
        targetEnvironment: 'test',
      }),
    error => error.code === 'SOURCE_URL_CREDENTIALS',
  );
  for (const key of ['signature', 'sig', 'jwt', 'X-Amz-Credential']) {
    assert.throws(
      () =>
        validateSource({
          sourceId: 'bad-signed-query',
          swaggerUiUrl: `https://example.com/swagger-ui/index.html?${key}=secret`,
          targetEnvironment: 'test',
        }),
      error => error.code === 'SOURCE_URL_CREDENTIALS',
    );
  }
  assert.doesNotThrow(() =>
    validateSource({
      sourceId: 'springdoc-group',
      swaggerUiUrl: 'https://example.com/v3/api-docs?group=public',
      targetEnvironment: 'test',
    }),
  );
});

test('signed discovery URLs are rejected before any raw cache write', async () => {
  primaryMode = 'signed-entry';
  const workspace = await createTestWorkspace('signed-entry');
  const result = await refreshOpenApi(workspace);
  const rawEntries = await readdir(join(workspace.cacheDir, 'raw')).catch(
    () => [],
  );
  const metadata = await readFile(
    join(workspace.cacheDir, 'metadata.json'),
    'utf8',
  );

  assert.equal(result.state, 'invalid');
  assert.equal(result.error.code, 'SOURCE_URL_CREDENTIALS');
  assert.deepEqual(rawEntries, []);
  assert.doesNotMatch(metadata, new RegExp(sentinelToken));
});

test('request timeout covers a stalled response body', async () => {
  primaryMode = 'stalled-body';
  const workspace = await createTestWorkspace('stalled-body');
  const result = await refreshOpenApi({ ...workspace, timeoutMs: 50 });

  assert.equal(result.state, 'unavailable');
  assert.equal(result.error.code, 'REQUEST_TIMEOUT');
});

test('swagger-config entries are constrained to the source origin', () => {
  assert.throws(
    () =>
      discoverDocumentEntries(
        { urls: [{ name: 'external', url: sentinelUrl }] },
        {
          configUrl: `${primaryUrl}/v3/api-docs/swagger-config`,
          sourceOrigin: primaryUrl,
        },
      ),
    error => error.code === 'CROSS_ORIGIN_URL',
  );
});

test('status redacts server repository names and run URLs while preserving SHA evidence', async () => {
  primaryMode = 'valid';
  const workspace = await createTestWorkspace('deployment-redaction');
  await writeSource(workspace.sourcePath, {
    serverRepository: {
      owner: 'private-owner',
      name: 'private-server',
      branch: 'develop',
      deployWorkflow: 'private-deploy.yml',
    },
  });
  const deployedSha = 'a'.repeat(40);
  const execFileSyncImpl = (_command, args) =>
    args[0] === 'run'
      ? JSON.stringify([{ databaseId: 1234, headSha: deployedSha }])
      : `${deployedSha}\n`;

  const result = await refreshOpenApi({ ...workspace, execFileSyncImpl });
  const status = JSON.stringify(getCacheStatus(workspace));

  assert.equal(result.metadata.deploymentEvidence.state, 'aligned');
  assert.match(status, new RegExp(deployedSha));
  assert.doesNotMatch(
    status,
    /private-owner|private-server|private-deploy|github\.com/,
  );
});
