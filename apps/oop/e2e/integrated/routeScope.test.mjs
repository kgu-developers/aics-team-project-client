import assert from 'node:assert/strict';
import { test } from 'node:test';

import { defaultStringifySearch } from '@tanstack/react-router';

import { routeScope } from './routeScope.ts';

test('observed meeting links preserve string section and team IDs through the router codec', () => {
  const scope = { sectionId: '33', teamId: '50' };
  const url = new URL(
    `/admin/meetings${defaultStringifySearch(scope)}`,
    'http://localhost',
  );
  assert.equal(url.searchParams.get('teamId'), '"50"');
  assert.deepEqual({ ...routeScope(url) }, scope);
});
