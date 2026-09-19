import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  adminMeetingFilter,
  adminMeetingRow,
} from './adminMeetingFilter.ts';

test('adminMeetingFilter targets the meetings page accessible group', () => {
  const locator = {};
  const page = {
    getByRole(role, options) {
      assert.equal(role, 'group');
      assert.deepEqual(options, { name: '회의록 필터', exact: true });
      return locator;
    },
  };

  assert.equal(adminMeetingFilter(page), locator);
});

test('adminMeetingRow targets the keyboard-accessible meeting table row', () => {
  const locator = {};
  const page = {
    getByRole(role, options) {
      assert.equal(role, 'row');
      assert.deepEqual(options, {
        name: '통합 회의 E2E-1 회의록 보기',
        exact: true,
      });
      return locator;
    },
  };

  assert.equal(adminMeetingRow(page, '통합 회의 E2E-1'), locator);
});
