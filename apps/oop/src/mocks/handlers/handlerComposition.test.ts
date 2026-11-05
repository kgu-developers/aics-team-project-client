import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { meetingApiTeam } from '../data/meetingApi';
import { createProjectProposalFixture } from '../data/projectProposal';
import { demoAccessToken } from '../data/users';

import { createHandlers } from './index';

const server = setupServer();
const headers = {
  Authorization: `Bearer ${demoAccessToken}`,
  'Content-Type': 'application/json',
};
const projectUrl = API_BASE_URL + ENDPOINTS.PROJECT.BY_TEAM('7');
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('기본 핸들러의 편집 잠금과 제안서 저장·조회가 같은 프로젝트와 버전을 사용한다', async () => {
  server.use(...createHandlers());
  const input = {
    sectionKey: 'TOPIC',
    sectionVersion: 0,
    title: '저장된 주제',
    description: '설명',
    goal: '목표',
  };
  expect(
    (
      await fetch(projectUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(input),
      })
    ).status,
  ).toBe(409);
  const lock = await fetch(API_BASE_URL + ENDPOINTS.EDIT_LOCKS.ROOT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      targetType: 'PROJECT',
      targetId: 17,
      sectionKey: 'TOPIC',
    }),
  });
  expect(lock.status).toBe(200);
  expect(
    (
      await fetch(projectUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(input),
      })
    ).status,
  ).toBe(200);
  const stored = await fetch(projectUrl, { headers }).then(response =>
    response.json(),
  );
  expect(stored).toMatchObject({
    id: 17,
    title: '저장된 주제',
    sectionVersions: { TOPIC: 1 },
  });
  expect(
    (
      await fetch(projectUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify(input),
      })
    ).status,
  ).toBe(409);
  server.resetHandlers(...createHandlers());
  expect(
    await fetch(projectUrl, { headers }).then(response => response.json()),
  ).toMatchObject({ sectionVersions: { TOPIC: 0 } });
  expect((await fetch(projectUrl)).status).toBe(401);
});

it('팀장 선점은 킥오프와 제안서의 같은 팀 상태에 반영된다', async () => {
  const team = structuredClone(meetingApiTeam);
  team.members.forEach(member => {
    member.isLeader = false;
  });
  server.use(
    ...createHandlers({
      project: {
        ...createProjectProposalFixture(),
        id: 17,
        teamId: 7,
        teamOperation: team,
      },
    }),
  );
  expect(
    (
      await fetch(API_BASE_URL + ENDPOINTS.TEAM.LEADER_CLAIM('7'), {
        method: 'POST',
        headers,
      })
    ).status,
  ).toBe(204);
  const kickoff = await fetch(API_BASE_URL + ENDPOINTS.TEAM.KICKOFF('7'), {
    headers,
  }).then(response => response.json());
  const project = await fetch(projectUrl, { headers }).then(response =>
    response.json(),
  );
  expect(
    kickoff.members.filter((member: { isLeader: boolean }) => member.isLeader),
  ).toMatchObject([{ studentNumber: '20260001' }]);
  expect(project.teamOperation).toEqual(kickoff);
});
