import { describe, expect, it } from 'vitest';

import { getStudentMilestonePreviewTemplateId } from './studentMilestonePreviewTemplate';

describe('getStudentMilestonePreviewTemplateId', () => {
  it.each([
    ['PRESENTATION', 'presentation-submit'],
    ['FINAL_REPORT', 'final-report'],
    ['MID_REPORT', 'midterm'],
    ['PROPOSAL', 'proposal'],
    ['GENERAL', undefined],
    ['PEER_EVALUATION', undefined],
  ] as const)(
    '마일스톤 유형 %s에 맞는 학생 미리보기만 반환한다',
    (milestoneType, expected) => {
      expect(getStudentMilestonePreviewTemplateId(milestoneType)).toBe(
        expected,
      );
    },
  );

  it('작성 중에는 선택한 학생 제출 양식을 반환한다', () => {
    expect(
      getStudentMilestonePreviewTemplateId(undefined, 'presentation-submit'),
    ).toBe('presentation-submit');
    expect(
      getStudentMilestonePreviewTemplateId(undefined, 'peer-review'),
    ).toBeUndefined();
  });
});
