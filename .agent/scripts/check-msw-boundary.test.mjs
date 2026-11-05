import assert from 'node:assert/strict';
import test from 'node:test';

import { inspectSource } from './check-msw-boundary.mjs';

test('allows the real API path and unrelated development diagnostics', () => {
  assert.deepEqual(
    inspectSource(
      "import {fetchUser} from '@aics/api-client'; if (import.meta.env.DEV) console.log('debug');",
    ),
    [],
  );
});
test('allows the narrowly scoped legacy worker cleanup filename', () => {
  assert.deepEqual(
    inspectSource(
      "registration.active?.scriptURL.endsWith('/mockServiceWorker.js')",
    ),
    [],
  );
});
test('rejects a mock environment switch in application code', () => {
  assert.ok(
    inspectSource('const enabled = import.meta.env.VITE_ENABLE_MSW;').length,
  );
});
test('rejects both static and dynamic imports of HTTP doubles', () => {
  for (const source of [
    "import {http} from 'msw';",
    "await import('msw/browser');",
    "await import('~/mocks/handlers');",
    "import data from '../../mocks/data/users';",
  ]) {
    assert.ok(inspectSource(source).length, source);
  }
});
test('rejects legacy preview headers while allowing the ordinary CSRF header', () => {
  assert.ok(
    inspectSource("const headers = {'X-OOP-Team-Assignment-Preview':'result'};")
      .length,
  );
  assert.deepEqual(
    inspectSource("const headers = {'X-XSRF-TOKEN':token};"),
    [],
  );
});
test('comments describing migration do not create false positives', () => {
  assert.deepEqual(
    inspectSource(
      '// VITE_ENABLE_MSW was removed.\nexport const realApi = true;',
    ),
    [],
  );
});
