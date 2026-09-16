import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { SectionAnnouncementListResponse } from '@aics/core';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  resetSectionAnnouncements,
  studentNoticeHandlers,
} from './studentNotices';
import { resetMockSessionState } from '../authSession';
import * as authSession from '../authSession';
import * as enrollments from '../data/enrollments';
import * as sections from '../data/sections';
import {
  demoAccessToken,
  demoUserAccounts,
  demoOtherSectionAccessToken,
  demoNoticeProfessorAccessToken,
  demoAdminAccessToken,
} from '../data/users';

const server = setupServer(...studentNoticeHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetSectionAnnouncements();
});
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

function fetchNotices(sectionId: number | string, accessToken?: string) {
  return fetch(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(String(sectionId))}`,
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  );
}

describe('studentNoticeHandlers', () => {
  it('학생의 소속 분반 공지를 Swagger envelope로 반환한다', async () => {
    const response = await fetchNotices(1, demoAccessToken);
    const body = (await response.json()) as SectionAnnouncementListResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({ contents: expect.any(Array) });
    expect(body.contents).not.toHaveLength(0);
    expect(body.contents.every(notice => notice.sectionId === 1)).toBe(true);
    expect(body.contents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 10,
          publishedAt: '2026-08-27 15:00',
          title: '이미지 자료 확인 안내',
        }),
        expect.objectContaining({
          id: 11,
          publishedAt: '2026-08-27 14:30',
          title: '제출 일정 안내',
        }),
        expect.objectContaining({
          id: 12,
          publishedAt: '2026-08-27 14:00',
          title: '읽음 상태 확인 공지',
        }),
      ]),
    );
    expect(body.contents.every(notice => typeof notice.id === 'number')).toBe(
      true,
    );
  });

  it('다른 분반 학생의 접근을 거부한다', async () => {
    const response = await fetchNotices(1, demoOtherSectionAccessToken);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: 'ACCESS_DENIED',
    });
  });

  it('로그인하지 않은 요청을 거부한다', async () => {
    const response = await fetchNotices(1);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      code: 'UNAUTHORIZED',
      message: '인증이 필요합니다.',
    });
  });

  it('숫자가 아닌 분반 ID를 거부한다', async () => {
    const response = await fetchNotices('oop-2026-2-01', demoAccessToken);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
});

it.each([
  ['GET', '/api/v1/sections/1/announcements'],
  ['GET', '/api/v1/sections/bad/announcements'],
  ['POST', '/api/v1/sections/1/announcements'],
  ['POST', '/api/v1/sections/bad/announcements'],
  ['PATCH', '/api/v1/announcements/10'],
  ['PATCH', '/api/v1/announcements/bad'],
])(
  '%s %s authenticates before ID/body validation and returns the current JSON 401',
  async (method, path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      ...(method === 'GET' ? {} : { body: 'malformed JSON' }),
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      code: 'UNAUTHORIZED',
      message: '인증이 필요합니다.',
    });
  },
);

it.each([
  ['GET', '/api/v1/sections/bad/announcements'],
  ['POST', '/api/v1/sections/0/announcements'],
  ['PATCH', '/api/v1/announcements/bad'],
])('%s %s validates the ID after authentication', async (method, path) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${demoNoticeProfessorAccessToken}` },
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ code: 'INVALID_INPUT' });
});

it.each([
  ['student', demoAccessToken, 10],
  ['other-section student', demoOtherSectionAccessToken, 10],
  ['assistant', demoAdminAccessToken, 10],
  ['other-section professor', demoNoticeProfessorAccessToken, 2],
])(
  'PATCH denies an existing foreign notice for a %s and uses the documented missing-record response',
  async (_role, token, existingId) => {
    for (const noticeId of [existingId, 999999]) {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/announcements/${noticeId}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ content: ' ' }),
        },
      );
      expect(response.status).toBe(noticeId === existingId ? 403 : 404);
      expect(await response.json()).toMatchObject({
        code:
          noticeId === existingId
            ? 'ACCESS_DENIED'
            : 'SECTION_ANNOUNCEMENT_NOT_FOUND',
      });
    }
  },
);

it('authorizes the owner before validating an empty PATCH and leaves the notice unchanged', async () => {
  const response = await fetch(`${API_BASE_URL}/api/v1/announcements/10`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${demoNoticeProfessorAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: ' ' }),
  });
  expect(response.status).toBe(400);
  const read = await fetchNotices(1, demoAccessToken);
  expect(
    (await read.json()).contents.find((item: { id: number }) => item.id === 10)
      .content,
  ).toBe('공지 본문과 게시일시가 학생 화면에 표시되는지 확인해 주세요.');
});

it('담당 교수는 한 분반에 게시·부분 수정하고 학생 재조회는 같은 리소스를 반환한다', async () => {
  const { demoNoticeProfessorAccessToken } = await import('../data/users');
  const headers = {
    Authorization: `Bearer ${demoNoticeProfessorAccessToken}`,
    'Content-Type': 'application/json',
  };
  const created = await fetch(
    `${API_BASE_URL}/api/v1/sections/1/announcements`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: '교수 공지', content: '첫 줄\n둘째 줄' }),
    },
  );
  expect(created.status).toBe(201);
  const original = await created.json();
  expect(Object.keys(original).sort()).toEqual([
    'content',
    'id',
    'publishedAt',
    'sectionId',
    'title',
  ]);
  const updated = await fetch(
    `${API_BASE_URL}/api/v1/announcements/${original.id}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ content: '수정 본문' }),
    },
  );
  expect(updated.status).toBe(200);
  expect(await updated.json()).toEqual({ ...original, content: '수정 본문' });
  const read = await fetchNotices(1, demoAccessToken);
  expect((await read.json()).contents).toContainEqual({
    ...original,
    content: '수정 본문',
  });
});
it('학생과 다른 분반 교수는 공지를 게시할 수 없고 빈 입력도 거부한다', async () => {
  const { demoNoticeProfessorAccessToken } = await import('../data/users');
  for (const [section, token, body, status] of [
    [1, demoAccessToken, { title: '권한', content: '본문' }, 403],
    [
      2,
      demoNoticeProfessorAccessToken,
      { title: '권한', content: '본문' },
      403,
    ],
    [1, demoNoticeProfessorAccessToken, { title: ' ', content: '본문' }, 400],
  ] as const) {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/sections/${section}/announcements`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    expect(response.status).toBe(status);
  }
});

it.each(['POST', 'PATCH'])(
  '%s malformed JSON is rejected after authentication and before ownership without unhandled errors',
  async method => {
    const path =
      method === 'POST'
        ? '/api/v1/sections/1/announcements'
        : '/api/v1/announcements/10';
    for (const token of [
      demoNoticeProfessorAccessToken,
      demoAdminAccessToken,
    ]) {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: 'malformed JSON',
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: 'INVALID_INPUT' });
    }
  },
);

it('assistant role alone cannot read/write, while an active enrollment independently grants read access only', async () => {
  expect((await fetchNotices(1, demoAdminAccessToken)).status).toBe(403);
  const student = demoUserAccounts[0];
  vi.spyOn(authSession, 'getMockAuthenticatedAccount').mockReturnValue({
    ...student,
    user: {
      ...student.user,
      globalRole: 'ASSISTANT',
      sections: student.user.sections.map(section => ({
        ...section,
        role: 'ASSISTANT',
      })),
    },
  });
  expect(
    enrollments.getMockEnrollments(student.credentials.studentNumber),
  ).toContainEqual({
    studentNumber: student.credentials.studentNumber,
    sectionId: 1,
    status: 'ACTIVE',
  });
  expect((await fetchNotices(1, demoAccessToken)).status).toBe(200);
  const write = await fetch(`${API_BASE_URL}/api/v1/sections/1/announcements`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${demoAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: '조교 공지', content: '본문' }),
  });
  expect(write.status).toBe(403);
  const patch = await fetch(`${API_BASE_URL}/api/v1/announcements/10`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${demoAccessToken}` },
    body: JSON.stringify({ content: '수정' }),
  });
  expect(patch.status).toBe(403);
});

it.each(['INACTIVE', 'DELETED'])(
  '%s enrollment does not grant read access despite a student section role',
  async status => {
    vi.spyOn(enrollments, 'getMockEnrollments').mockReturnValue([
      { studentNumber: '20260001', sectionId: 1, status },
    ]);
    expect((await fetchNotices(1, demoAccessToken)).status).toBe(403);
  },
);

it('inactive professor ownership grants neither read nor write without enrollment', async () => {
  vi.spyOn(sections, 'getMockMySections').mockReturnValue([]);
  expect((await fetchNotices(1, demoNoticeProfessorAccessToken)).status).toBe(
    403,
  );
  for (const [method, path] of [
    ['POST', '/api/v1/sections/1/announcements'],
    ['PATCH', '/api/v1/announcements/10'],
  ]) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${demoNoticeProfessorAccessToken}` },
      body: JSON.stringify({ title: '공지', content: '본문' }),
    });
    expect(response.status).toBe(403);
  }
});

it.each(['0x1', '1e0', ' 1 ', '01', '0', '-1', '1.0', '9007199254740992'])(
  'rejects noncanonical decimal ID %s for GET, POST and PATCH',
  async value => {
    for (const [method, path] of [
      ['GET', `/api/v1/sections/${encodeURIComponent(value)}/announcements`],
      ['POST', `/api/v1/sections/${encodeURIComponent(value)}/announcements`],
      ['PATCH', `/api/v1/announcements/${encodeURIComponent(value)}`],
    ]) {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${demoNoticeProfessorAccessToken}` },
        ...(method === 'GET'
          ? {}
          : { body: JSON.stringify({ title: '공지', content: '본문' }) }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: 'INVALID_INPUT' });
    }
  },
);

it.each([
  '2026-09-15',
  '2026-09-15T00:00:00',
  '2026-09-15 00:00',
  '2026-09-14T15:00:00Z',
  '2026-09-15T00:00:00+09:00',
])('publishes %s at the same Seoul instant', async publishedAt => {
  const at = Date.parse('2026-09-14T15:00:00Z');
  const clock = vi.spyOn(Date, 'now').mockReturnValue(at - 1);
  const created = await fetch(
    `${API_BASE_URL}/api/v1/sections/1/announcements`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${demoNoticeProfessorAccessToken}` },
      body: JSON.stringify({
        title: '예약 공지',
        content: '본문',
        publishedAt,
      }),
    },
  );
  expect(created.status).toBe(201);
  const notice = await created.json();
  expect(
    (await (await fetchNotices(1, demoAccessToken)).json()).contents,
  ).not.toContainEqual(notice);
  clock.mockReturnValue(at);
  expect(
    (await (await fetchNotices(1, demoAccessToken)).json()).contents,
  ).toContainEqual(notice);
});
