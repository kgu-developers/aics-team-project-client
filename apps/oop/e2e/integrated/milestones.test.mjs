import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createdMilestonePath,
  milestoneTemplateOption,
} from './milestoneRoute.ts';

test('createdMilestonePath derives the detail route from the creation response', () => {
  assert.equal(
    createdMilestonePath(
      'https://example.test/api/v1/admin/sections/43/milestones',
      { id: 161 },
    ),
    '/admin/milestones/161?sectionId=43',
  );
});

test('createdMilestonePath rejects an unrelated endpoint or invalid id', () => {
  assert.throws(
    () =>
      createdMilestonePath('https://example.test/api/v1/milestones', {
        id: 1,
      }),
    /Unexpected milestone creation URL/,
  );
  assert.throws(
    () =>
      createdMilestonePath(
        'https://example.test/api/v1/admin/sections/43/milestones',
        { id: 0 },
      ),
    /positive id/,
  );
});

test('milestoneTemplateOption uses the complete accessible presentation label', () => {
  assert.equal(milestoneTemplateOption('발표'), '발표 (자료 제출 + 평가)');
  assert.equal(milestoneTemplateOption('제안서'), '제안서');
});
