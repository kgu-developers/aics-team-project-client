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
} from 'vitest';

import { studentNoticeHandlers } from './studentNotices';
import { resetMockSessionState } from '../authSession';
import { demoAccessToken, demoOtherSectionAccessToken } from '../data/users';

const server = setupServer(...studentNoticeHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetMockSessionState());
afterEach(() => server.resetHandlers());
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
  });

  it('숫자가 아닌 분반 ID를 거부한다', async () => {
    const response = await fetchNotices('oop-2026-2-01', demoAccessToken);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_INPUT',
    });
  });
});
