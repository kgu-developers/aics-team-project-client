import {
  fetchTeamMemberContacts,
  fetchTeamProject,
  updateTopicDirectFinalization,
  fetchCurrentUser,
  ENDPOINTS,
  API_BASE_URL,
} from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import {
  resetMockMySections,
  updateMockSectionContactVisibility,
} from '../data/sections';
import { demoAccessToken, demoPartnerAccessToken } from '../data/users';

import { createHandlers } from './index';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  server.use(...createHandlers());
  useAuthStore.getState().setAccessToken(demoAccessToken);
  updateMockSectionContactVisibility(1, {
    contactVisibleFrom: '2020-01-01T00:00:00+09:00',
    contactVisibleUntil: null,
  });
});
afterEach(() => {
  server.resetHandlers();
  resetMockMySections();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

it('기본 MSW 목록에서 로그인 사용자·팀 연락처·프로젝트 상태가 같은 팀을 가리킨다', async () => {
  const user = await fetchCurrentUser('STUDENT');
  expect(user.teamId).toBe('7');
  expect(user.sections[0]?.id).toBe('1');
  const contacts = await fetchTeamMemberContacts(user.teamId!);
  expect(contacts.map(member => member.studentNumber)).toContain(
    user.studentNumber,
  );
  expect(await fetchTeamProject('7')).toBeNull();
  expect(
    await updateTopicDirectFinalization('7', {
      title: '합의한 주제',
      description: '설명',
    }),
  ).toMatchObject({ candidateId: null, title: '합의한 주제' });
  expect(await fetchTeamProject('7')).toMatchObject({
    teamId: 7,
    title: '합의한 주제',
    description: '설명',
  });
  const candidates = await fetch(
    `${API_BASE_URL}${ENDPOINTS.TOPIC.CANDIDATES('7')}`,
    { headers: { Authorization: `Bearer ${demoAccessToken}` } },
  );
  expect(await candidates.json()).toEqual({ contents: [] });
});
it('팀원도 연락처를 읽지만 직접 제출은 403으로 거절한다', async () => {
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  expect(await fetchTeamMemberContacts('7')).toHaveLength(3);
  await expect(
    updateTopicDirectFinalization('7', { title: '주제', description: '설명' }),
  ).rejects.toMatchObject({ response: { status: 403 } });
  expect(await fetchTeamProject('7')).toBeNull();
});
it('기간 종료와 다른 팀의 연락처는 403으로 거절한다', async () => {
  updateMockSectionContactVisibility(1, {
    contactVisibleFrom: '2020-01-01T00:00:00+09:00',
    contactVisibleUntil: '2020-01-02T00:00:00+09:00',
  });
  await expect(fetchTeamMemberContacts('7')).rejects.toMatchObject({
    response: { status: 403 },
  });
  await expect(fetchTeamMemberContacts('8')).rejects.toMatchObject({
    response: { status: 403 },
  });
});
