import assert from 'node:assert/strict';
import { test } from 'node:test';

import { gotoAdminPath } from './adminNavigation.ts';

function fakePage(paths) {
  let current = '/';
  return {
    visits: [],
    async goto(path) {
      this.visits.push(path);
      current = paths.shift() ?? path;
    },
    url() {
      return `https://example.test${current}`;
    },
  };
}

test('gotoAdminPath keeps an authenticated navigation single-pass', async () => {
  const page = fakePage(['/admin/meetings']);
  let recoveries = 0;
  await gotoAdminPath(page, '/admin/meetings', async () => {
    recoveries += 1;
  });
  assert.deepEqual(page.visits, ['/admin/meetings']);
  assert.equal(recoveries, 0);
});

test('gotoAdminPath logs in once and retries an expired admin navigation', async () => {
  const page = fakePage(['/login', '/admin/meetings']);
  let recoveries = 0;
  await gotoAdminPath(page, '/admin/meetings', async () => {
    recoveries += 1;
  });
  assert.deepEqual(page.visits, ['/admin/meetings', '/admin/meetings']);
  assert.equal(recoveries, 1);
});

test('gotoAdminPath rejects a recovery that still redirects to login', async () => {
  const page = fakePage(['/login', '/login']);
  await assert.rejects(
    gotoAdminPath(page, '/admin/meetings', async () => {}),
    /Admin session recovery failed/,
  );
});
