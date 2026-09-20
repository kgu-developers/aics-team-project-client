import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  currentProposalDetailPath,
  presentationEvaluationRowName,
  presentationSettingsAccessibleName,
} from './reviewRoute.ts';

test('currentProposalDetailPath preserves the proven proposal detail resource', () => {
  assert.equal(
    currentProposalDetailPath(
      'https://example.test/admin/submissions/185?milestoneId=proposal&sectionId=45&teamId=78',
    ),
    '/admin/submissions/185?milestoneId=proposal&sectionId=45&teamId=78',
  );
  assert.throws(
    () =>
      currentProposalDetailPath(
        'https://example.test/admin/submissions?milestoneId=proposal',
      ),
    /Expected an admin proposal detail URL/,
  );
  assert.throws(
    () =>
      currentProposalDetailPath(
        'https://example.test/admin/submissions/185?milestoneId=midterm',
      ),
    /Expected a proposal detail URL/,
  );
});

test('presentation settings use the current accessible name', () => {
  assert.equal(presentationSettingsAccessibleName, '발표 순서·평가 항목 설정');
});

test('presentationEvaluationRowName targets the clickable evaluation row', () => {
  assert.equal(
    presentationEvaluationRowName('비교 팀 E2E249-1'),
    '비교 팀 E2E249-1 발표 평가 보기',
  );
});
