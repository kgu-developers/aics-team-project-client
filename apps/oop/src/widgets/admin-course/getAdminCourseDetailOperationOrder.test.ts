import { describe, expect, it } from 'vitest';

import { getAdminCourseDetailOperationOrder } from './getAdminCourseDetailOperationOrder';

describe('getAdminCourseDetailOperationOrder', () => {
  it('학생 명단이 없으면 데이터 업로드를 우선한다', () => {
    expect(
      getAdminCourseDetailOperationOrder({
        hasStudentRoster: false,
        hasTeamRoster: false,
      }),
    ).toEqual(['dataUpload', 'preSurvey', 'artifactSummary']);
  });

  it('학생 명단만 있으면 사전 정보를 우선한다', () => {
    expect(
      getAdminCourseDetailOperationOrder({
        hasStudentRoster: true,
        hasTeamRoster: false,
      }),
    ).toEqual(['preSurvey', 'dataUpload', 'artifactSummary']);
  });

  it('팀 명단까지 있으면 산출물 현황을 우선한다', () => {
    expect(
      getAdminCourseDetailOperationOrder({
        hasStudentRoster: true,
        hasTeamRoster: true,
      }),
    ).toEqual(['artifactSummary', 'preSurvey', 'dataUpload']);
  });
});
