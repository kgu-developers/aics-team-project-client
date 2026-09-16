import assert from 'node:assert/strict';
import { test } from 'node:test';

import { defaultStringifySearch } from '@tanstack/react-router';

import { meetingRecordRequestPath, routeScope } from './routeScope.ts';

test('observed meeting links preserve scope IDs and use the normalized record response path', () => {
  const scope = { sectionId: '33', teamId: '50' };
  const url = new URL(
    `/admin/meetings${defaultStringifySearch(scope)}`,
    'http://localhost',
  );
  assert.equal(
    meetingRecordRequestPath('/student/meetings/42'),
    '/api/v1/meeting-records/42',
  );
  assert.throws(
    () => meetingRecordRequestPath('/student/meetings/new'),
    /observed/,
  );
  assert.equal(url.searchParams.get('teamId'), '"50"');
  assert.deepEqual({ ...routeScope(url) }, scope);
});
