import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { SectionAnnouncement } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { studentNoticeHandlers } from './studentNotices';
import { demoAccessToken, demoOtherSectionAccessToken } from '../data/users';

const server = setupServer(...studentNoticeHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function fetchNotices(sectionId: string, accessToken?: string) {
  return fetch(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(sectionId)}`,
    accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  );
}

describe('studentNoticeHandlers', () => {
  it('학생의 소속 분반 공지만 반환한다', async () => {
    const response = await fetchNotices('oop-2026-2-01', demoAccessToken);
    const notices = (await response.json()) as SectionAnnouncement[];

    expect(response.status).toBe(200);
    expect(notices).not.toHaveLength(0);
    expect(notices.every(notice => notice.sectionId === 'oop-2026-2-01')).toBe(
      true,
    );
    expect(notices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: '10',
          title: '[첨부 테스트] 이미지 미리보기 확인',
        }),
        expect.objectContaining({
          id: '11',
          title: '[첨부 테스트] PDF 다운로드 확인',
        }),
        expect.objectContaining({
          id: '12',
          title: '[읽음 테스트] 첨부파일 없는 공지',
        }),
      ]),
    );
    expect(notices.find(notice => notice.id === '1')).toEqual(
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({ contentType: 'image/svg+xml' }),
          expect.objectContaining({ contentType: 'application/pdf' }),
        ]),
      }),
    );
    expect(notices.find(notice => notice.id === '10')?.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ contentType: 'image/svg+xml' }),
        expect.objectContaining({ contentType: 'image/png' }),
      ]),
    );
    expect(notices.find(notice => notice.id === '11')?.attachments).toEqual([
      expect.objectContaining({ contentType: 'application/pdf' }),
    ]);
    expect(notices.find(notice => notice.id === '12')?.attachments).toBe(
      undefined,
    );
  });

  it('다른 분반 학생의 접근을 거부한다', async () => {
    const response = await fetchNotices(
      'oop-2026-2-01',
      demoOtherSectionAccessToken,
    );

    expect(response.status).toBe(403);
  });

  it('로그인하지 않은 요청을 거부한다', async () => {
    const response = await fetchNotices('oop-2026-2-01');

    expect(response.status).toBe(401);
  });
});
