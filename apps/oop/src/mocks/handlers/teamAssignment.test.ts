import {
  fetchTeamAssignmentProjection,
  requestPartner,
  setApiAccessToken,
  submitTeamAssignmentSurvey,
} from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  resetTeamAssignmentMockData,
  teamAssignmentHandlers,
} from './teamAssignment';
import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoPartnerStudent,
  demoStudent,
} from '../data/users';

const server = setupServer(...teamAssignmentHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetTeamAssignmentMockData();
  setApiAccessToken(null);
});
afterAll(() => server.close());

describe('team assignment MSW contract', () => {
  it('설문 제출 후 결과 발표 대기 단계로 이동시킨다', async () => {
    setApiAccessToken(demoAccessToken);

    await submitTeamAssignmentSurvey({
      sectionId: 'oop-2026-2-01',
      survey: {
        note: '',
        rolePreferences: ['DEVELOPMENT'],
        topicIdea: '',
      },
    });

    const projection = await fetchTeamAssignmentProjection('oop-2026-2-01');

    expect(projection.phase).toBe('resultWaiting');
    expect(projection.window.resultReleasesAt).toBeDefined();
  });

  it('개발 preview를 명시하면 대기 중에도 팀 선정 결과를 조회한다', async () => {
    setApiAccessToken(demoAccessToken);

    const projection = await fetchTeamAssignmentProjection(
      'oop-2026-2-01',
      'result',
    );

    expect(projection.phase).toBe('result');
    expect(projection.assignedTeam).toBeDefined();
  });

  it('파트너 신청의 발신자는 recipient를, 수신자는 requester를 확인한다', async () => {
    setApiAccessToken(demoAccessToken);

    const outgoingProjection = await requestPartner(
      'oop-2026-2-01',
      'student-b',
    );

    expect(outgoingProjection.outgoingPartnerRequest?.recipient).toMatchObject({
      name: demoPartnerStudent.name,
      studentNumber: demoPartnerStudent.studentNumber,
    });

    setApiAccessToken(demoPartnerAccessToken);
    const incomingProjection =
      await fetchTeamAssignmentProjection('oop-2026-2-01');

    expect(incomingProjection.incomingPartnerRequest?.requester).toMatchObject({
      name: demoStudent.name,
      studentNumber: demoStudent.studentNumber,
    });
  });
});
