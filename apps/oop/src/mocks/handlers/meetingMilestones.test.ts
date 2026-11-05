import { API_BASE_URL } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { demoAccessToken } from '../data/users';

import { createHandlers } from './index';

const server = setupServer();
const headers = {
  Authorization: `Bearer ${demoAccessToken}`,
  'Content-Type': 'application/json',
};
const root = `${API_BASE_URL}/api/v1`;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => server.use(...createHandlers()));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('회의록 생성·목록·상세에서 연결한 마일스톤의 서버 응답 형태를 유지한다', async () => {
  const response = await fetch(`${root}/teams/7/meeting-records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: '계약 확인',
      content: '내용',
      phase: 'PROPOSAL',
      meetingAt: '2026-11-05T10:00:00',
      participantIds: ['20260001'],
      milestoneIds: [1301],
    }),
  });
  expect(response.status).toBe(201);
  const created = await response.json();
  expect(created.milestones).toEqual([
    { id: 1301, title: '제안서', type: 'PROPOSAL', weekNumber: 3 },
  ]);
  expect(created).not.toHaveProperty('milestoneIds');
  const detail = await fetch(`${root}/meeting-records/${created.id}`, {
    headers,
  }).then(response => response.json());
  const list = await fetch(`${root}/teams/7/meeting-records`, { headers }).then(
    response => response.json(),
  );
  expect(detail.milestones).toEqual(created.milestones);
  expect(
    list.contents.find((record: { id: number }) => record.id === created.id)
      .milestones,
  ).toEqual(created.milestones);
  const cleared = await fetch(`${root}/meeting-records/${created.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      milestoneIds: [],
      reason: '연결된 마일스톤을 해제하는 사유를 삼십 자 이상 작성합니다.',
    }),
  });
  expect(cleared.status).toBe(200);
  expect(
    await fetch(`${root}/meeting-records/${created.id}`, { headers }).then(
      response => response.json(),
    ),
  ).toMatchObject({ milestones: [] });
});

it('문서에 없는 마일스톤 ID는 저장하지 않고 테스트 상태는 요청 묶음별로 격리한다', async () => {
  const response = await fetch(`${root}/teams/7/meeting-records`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: '잘못된 연결',
      content: '내용',
      phase: 'PROPOSAL',
      meetingAt: '2026-11-05T10:00:00',
      milestoneIds: [999],
    }),
  });
  expect(response.status).toBe(400);
  const list = await fetch(`${root}/teams/7/meeting-records`, { headers }).then(
    response => response.json(),
  );
  expect(list.contents.map((record: { id: number }) => record.id)).toEqual([
    19,
  ]);
});
