import {
  API_BASE_URL,
  apiClient,
  fetchTeamMessages,
  fetchTeamThread,
  setApiAccessToken,
  submitTeamMessage,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { resetMockSessionState } from '../../../mocks/authSession';
import { teamMessageProfessorId } from '../../../mocks/data/teamMessages';
import {
  demoAccessToken,
  demoOtherSectionAccessToken,
} from '../../../mocks/data/users';
import { createTeamMessageHandlers } from '../../../mocks/handlers/teamMessages';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  setApiAccessToken(demoAccessToken);
  server.use(...createTeamMessageHandlers());
});
afterEach(() => {
  setApiAccessToken(null);
  resetMockSessionState();
  server.resetHandlers();
});
afterAll(() => server.close());

it('팀 스레드를 확보하고 PROPOSAL 페이지만 페이지 정보와 함께 조회한다', async () => {
  const thread = await fetchTeamThread('7');
  const first = await fetchTeamMessages('7', {
    relatedType: 'PROPOSAL',
    page: 0,
    size: 2,
  });
  const second = await fetchTeamMessages('7', {
    relatedType: 'PROPOSAL',
    page: 1,
    size: 2,
  });

  expect(thread).toMatchObject({ teamId: 7, threadId: 70 });
  expect(first.contents.map(message => message.id)).toEqual([704, 702]);
  expect(first.pageable).toEqual({
    page: 0,
    size: 2,
    totalElements: 3,
    totalPages: 2,
    isEnd: false,
  });
  expect(second.contents.map(message => message.id)).toEqual([701]);
  expect(second.pageable).toMatchObject({ page: 1, isEnd: true });
  expect([...first.contents, ...second.contents]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        threadId: thread.threadId,
        relatedType: 'PROPOSAL',
        senderId: '20260001',
      }),
    ]),
  );
});

it('전송은 인증된 학번을 저장하고 같은 팀 방의 후속 조회에 나타난다', async () => {
  const message = await submitTeamMessage('7', {
    message: '제안서의 기능 범위에 대한 답변입니다.',
    relatedType: 'PROPOSAL',
  });

  expect(message).toMatchObject({
    threadId: 70,
    senderId: '20260001',
    relatedType: 'PROPOSAL',
    message: '제안서의 기능 범위에 대한 답변입니다.',
  });
  expect(message).not.toHaveProperty('important');
  expect(message).not.toHaveProperty('read');
  expect(message).not.toHaveProperty('relatedId');
  const page = await fetchTeamMessages('7', { relatedType: 'PROPOSAL' });
  expect(page.contents).toContainEqual({
    ...message,
    important: false,
    read: false,
  });
  expect(page.pageable.totalElements).toBe(4);
});

it('관련 유형을 생략한 전송은 GENERAL이며 실제 relatedId 수치를 유지한다', async () => {
  const message = await submitTeamMessage('7', {
    message: '다음 상담 시간을 문의합니다.',
    relatedId: 41,
  });
  expect(message).toMatchObject({ relatedType: 'GENERAL', relatedId: 41 });
  const page = await fetchTeamMessages('7', { relatedType: 'GENERAL' });
  expect(page.contents.some(item => item.id === message.id)).toBe(true);
});

it('관련 유형에 메시지가 없으면 마지막 빈 페이지를 반환한다', async () => {
  const page = await fetchTeamMessages('7', { relatedType: 'QUESTION' });
  expect(page.contents).toEqual([]);
  expect(page.pageable).toMatchObject({
    size: 10,
    totalElements: 0,
    totalPages: 0,
    isEnd: true,
  });
});

it('분리된 팀은 서로 다른 방을 확보하고 동일 팀 재조회는 방을 유지한다', async () => {
  server.use(
    ...createTeamMessageHandlers({
      getAuthenticatedUserId: () => teamMessageProfessorId,
    }),
  );
  const first = await fetchTeamThread('7');
  const second = await fetchTeamThread('8');
  expect(first.threadId).not.toBe(second.threadId);
  expect(await fetchTeamThread('8')).toEqual(second);
});

it('비팀원인 담당 교수와 학생이 같은 방에서 메시지를 주고받는다', async () => {
  // Inject only the authenticated actor; exercise the actual MSW access policy.
  let userId = teamMessageProfessorId;
  server.use(
    ...createTeamMessageHandlers({
      getAuthenticatedUserId: () => userId,
    }),
  );
  const thread = await fetchTeamThread('7');
  const feedback = await submitTeamMessage('7', {
    message: '교수 피드백',
    relatedType: 'PROPOSAL',
  });
  expect(feedback).toMatchObject({
    threadId: thread.threadId,
    senderId: teamMessageProfessorId,
  });

  userId = '20260001';
  const studentPage = await fetchTeamMessages('7', { relatedType: 'PROPOSAL' });
  expect(studentPage.contents).toContainEqual({
    ...feedback,
    important: false,
    read: false,
  });
  const reply = await submitTeamMessage('7', {
    message: '교수 피드백에 대한 학생 답변',
    relatedType: 'PROPOSAL',
  });
  expect(reply).toMatchObject({
    threadId: feedback.threadId,
    senderId: userId,
  });

  userId = teamMessageProfessorId;
  const professorPage = await fetchTeamMessages('7', {
    relatedType: 'PROPOSAL',
  });
  expect(professorPage.contents.slice(0, 2).map(message => message.id)).toEqual(
    [reply.id, feedback.id],
  );
});

it('담당 교수의 첫 전송으로 만든 방과 다른 팀의 방은 섞이지 않는다', async () => {
  server.use(
    ...createTeamMessageHandlers({
      getAuthenticatedUserId: () => teamMessageProfessorId,
    }),
  );
  await expect(fetchTeamMessages('8')).rejects.toMatchObject({
    response: { status: 404, data: { code: 'TEAM_THREAD_NOT_FOUND' } },
  });
  const feedback = await submitTeamMessage('8', {
    message: '다른 팀의 첫 제안서 피드백',
    relatedType: 'PROPOSAL',
  });
  const thread = await fetchTeamThread('8');
  expect(feedback.threadId).toBe(thread.threadId);
  expect(thread.threadId).not.toBe((await fetchTeamThread('7')).threadId);
  expect(
    (await fetchTeamMessages('8', { relatedType: 'PROPOSAL' })).contents,
  ).toEqual([{ ...feedback, important: false, read: false }]);
  expect(
    (await fetchTeamMessages('7', { relatedType: 'PROPOSAL' })).contents.some(
      message => message.id === feedback.id,
    ),
  ).toBe(false);
});

it('담당하지 않는 분반의 팀은 교수도 조회하거나 전송할 수 없다', async () => {
  server.use(
    ...createTeamMessageHandlers({
      getAuthenticatedUserId: () => teamMessageProfessorId,
    }),
  );
  await expect(fetchTeamThread('9')).rejects.toMatchObject({
    response: { status: 403 },
  });
  await expect(fetchTeamMessages('9')).rejects.toMatchObject({
    response: { status: 403, data: { code: 'ACCESS_DENIED' } },
  });
  await expect(
    submitTeamMessage('9', { message: '교수 피드백', relatedType: 'PROPOSAL' }),
  ).rejects.toMatchObject({
    response: { status: 403, data: { code: 'ACCESS_DENIED' } },
  });
});

it('같은 교수의 다른 팀이라도 학생에게는 접근 권한을 주지 않는다', async () => {
  await expect(fetchTeamThread('8')).rejects.toMatchObject({
    response: { status: 403 },
  });
  await expect(fetchTeamMessages('8')).rejects.toMatchObject({
    response: { status: 403 },
  });
  await expect(
    submitTeamMessage('8', { message: '다른 팀에 보낼 수 없는 답변' }),
  ).rejects.toMatchObject({ response: { status: 403 } });
});

it('인증이 없으면 방·메시지 조회 및 전송이 모두 401이다', async () => {
  setApiAccessToken(null);
  await expect(fetchTeamThread('7')).rejects.toMatchObject({
    response: { status: 401 },
  });
  await expect(fetchTeamMessages('7')).rejects.toMatchObject({
    response: { status: 401 },
  });
  await expect(
    submitTeamMessage('7', { message: '답변' }),
  ).rejects.toMatchObject({
    response: { status: 401 },
  });
});

it('다른 분반 학생은 팀의 방·메시지 조회 및 전송이 모두 403이다', async () => {
  setApiAccessToken(demoOtherSectionAccessToken);
  await expect(fetchTeamThread('7')).rejects.toMatchObject({
    response: { status: 403 },
  });
  await expect(fetchTeamMessages('7')).rejects.toMatchObject({
    response: { status: 403 },
  });
  await expect(
    submitTeamMessage('7', { message: '답변' }),
  ).rejects.toMatchObject({
    response: { status: 403 },
  });
});

it('빈 메시지와 잘못된 관련 유형을 400으로 거부한다', async () => {
  await expect(
    submitTeamMessage('7', { message: '   ' }),
  ).rejects.toMatchObject({
    response: { status: 400 },
  });
  await expect(
    apiClient.post('/api/v1/teams/7/messages', {
      message: '답변',
      relatedType: 'UNKNOWN',
    }),
  ).rejects.toMatchObject({ response: { status: 400 } });
  await expect(
    apiClient.post('/api/v1/teams/7/messages', '{', {
      transformRequest: value => value,
    }),
  ).rejects.toMatchObject({ response: { status: 400 } });
});

it('목록에 잘못된 관련 유형을 요청하면 400이다', async () => {
  await expect(
    apiClient.get('/api/v1/teams/7/messages', {
      params: { relatedType: 'UNKNOWN' },
    }),
  ).rejects.toMatchObject({ response: { status: 400 } });
});

it('요청은 실제 계약 URL과 query 및 message 본문만 사용한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/api/v1/teams/7/messages`, ({ request }) => {
      expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
        relatedType: 'PROPOSAL',
        page: '2',
        size: '10',
      });
      return HttpResponse.json({
        contents: [],
        pageable: {
          page: 2,
          size: 10,
          totalElements: 0,
          totalPages: 0,
          isEnd: true,
        },
      });
    }),
    http.post(
      `${API_BASE_URL}/api/v1/teams/7/messages`,
      async ({ request }) => {
        expect(await request.json()).toEqual({
          relatedType: 'PROPOSAL',
          message: '범위를 정리했습니다.',
        });
        return HttpResponse.json(
          {
            id: 10,
            threadId: 70,
            senderId: '20260001',
            relatedType: 'PROPOSAL',
            message: '범위를 정리했습니다.',
            createdAt: '2026-09-09 10:00',
          },
          { status: 201 },
        );
      },
    ),
  );
  await fetchTeamMessages('7', { relatedType: 'PROPOSAL', page: 2, size: 10 });
  await submitTeamMessage('7', {
    relatedType: 'PROPOSAL',
    message: '범위를 정리했습니다.',
  });
});

it('가상 팀 ID와 안전 정수 범위를 넘는 관련 ID는 요청 전에 거부한다', async () => {
  await expect(fetchTeamThread('team-07')).rejects.toThrow('식별자');
  await expect(fetchTeamMessages('')).rejects.toThrow('식별자');
  await expect(
    submitTeamMessage('7', {
      message: '답변',
      relatedId: Number.MAX_SAFE_INTEGER + 1,
    }),
  ).rejects.toThrow('식별자');
});

it('취소된 조회의 신호를 HTTP 요청에 전달한다', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    fetchTeamThread('7', { signal: controller.signal }),
  ).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  await expect(
    fetchTeamMessages('7', {}, { signal: controller.signal }),
  ).rejects.toMatchObject({ code: 'ERR_CANCELED' });
});
