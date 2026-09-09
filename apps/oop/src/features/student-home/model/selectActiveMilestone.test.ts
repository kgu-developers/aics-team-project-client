import type { StudentHomeMilestone } from '@aics/core';
import { expect, it } from 'vitest';

import { selectActiveMilestone } from './selectActiveMilestone';

function stage(
  id: string,
  status: StudentHomeMilestone['status'],
): StudentHomeMilestone {
  return {
    id,
    status,
    title: id,
    statusLabel: '',
    period: '',
    dueDate: '',
    interaction: 'static',
    isDetailAvailable: false,
    rows: [],
  };
}
it('종료된 이전 단계를 건너뛰고 제출 가능한 실제 ID를 선택한다', () => {
  const active = stage('71', 'revision-available');
  expect(
    selectActiveMilestone(
      [stage('52', 'closed'), stage('63', 'in-progress'), active],
      new Set(['71']),
    ),
  ).toBe(active);
});
it('모든 단계가 종료·완료·조회 불가이면 이동 대상을 만들지 않는다', () => {
  expect(
    selectActiveMilestone(
      [
        stage('52', 'closed'),
        stage('63', 'completed'),
        stage('71', 'unavailable'),
      ],
      new Set(),
    ),
  ).toBeUndefined();
  expect(selectActiveMilestone([], new Set())).toBeUndefined();
});
it('진행 중 단계가 없으면 다음 예정 단계를 안내한다', () => {
  const upcoming = stage('71', 'before-period');
  expect(
    selectActiveMilestone([stage('52', 'closed'), upcoming], new Set()),
  ).toBe(upcoming);
});
