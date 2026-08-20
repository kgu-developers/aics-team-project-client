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
  assignedFixture,
  demoTeamAssignmentSectionId,
} from '../data/teamAssignment';
import {
  demoAccessToken,
  demoCompletedAccessToken,
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

  it('인증되지 않은 요청에는 개발 preview를 제공하지 않는다', async () => {
    setApiAccessToken(null);

    await expect(
      fetchTeamAssignmentProjection(
        demoTeamAssignmentSectionId,
        'firstMeeting',
      ),
    ).rejects.toMatchObject({
      response: { data: { code: 'UNAUTHORIZED' }, status: 401 },
    });
  });

  it('완료된 학생은 파트너 신청을 만들거나 상대 학생 상태를 바꾸지 못한다', async () => {
    setApiAccessToken(demoPartnerAccessToken);
    const recipientBefore = await fetchTeamAssignmentProjection(
      demoTeamAssignmentSectionId,
    );

    setApiAccessToken(demoCompletedAccessToken);
    await expect(
      requestPartner(demoTeamAssignmentSectionId, 'student-b'),
    ).rejects.toMatchObject({
      response: { data: { code: 'PHASE_CLOSED' }, status: 403 },
    });

    setApiAccessToken(demoPartnerAccessToken);
    await expect(
      fetchTeamAssignmentProjection(demoTeamAssignmentSectionId),
    ).resolves.toEqual(recipientBefore);
  });

  it('연락처는 첫 만남 단계에서만 projection에 포함한다', () => {
    expect(assignedFixture('result').assignedTeam?.members).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ phoneNumber: expect.any(String) }),
      ]),
    );
    expect(assignedFixture('firstMeeting').assignedTeam?.members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phoneNumber: expect.any(String) }),
      ]),
    );
    expect(assignedFixture('completed').assignedTeam?.members).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ phoneNumber: expect.any(String) }),
      ]),
    );
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
