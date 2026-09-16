import {
  API_BASE_URL,
  ENDPOINTS,
  fetchSectionAnnouncements,
  submitSectionAnnouncement,
  updateSectionAnnouncement,
} from '@aics/api-client';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const announcement = {
  id: 10,
  sectionId: 1,
  title: '공지',
  content: '본문',
  publishedAt: '2026-09-16T09:00:00',
};

it('GET/POST/PATCH는 한 번만 정규화한 실제 경로와 contents/단일 응답 계약을 사용한다', async () => {
  const requests: unknown[] = [];
  server.use(
    http.get(`${API_BASE_URL}/api/v1/sections/1/announcements`, () =>
      HttpResponse.json({ contents: [announcement] }),
    ),
    http.post(
      `${API_BASE_URL}/api/v1/sections/1/announcements`,
      async ({ request }) => {
        requests.push(await request.json());
        return HttpResponse.json(announcement, { status: 201 });
      },
    ),
    http.patch(
      `${API_BASE_URL}/api/v1/announcements/10`,
      async ({ request }) => {
        const input = await request.json();
        requests.push(input);
        return HttpResponse.json({ ...announcement, ...(input as object) });
      },
    ),
  );
  expect(await fetchSectionAnnouncements('1')).toEqual([announcement]);
  expect(
    await submitSectionAnnouncement(1, { title: '공지', content: '본문' }),
  ).toEqual(announcement);
  expect(await updateSectionAnnouncement('10', { content: '수정' })).toEqual({
    ...announcement,
    content: '수정',
  });
  expect(requests).toEqual([
    { title: '공지', content: '본문' },
    { content: '수정' },
  ]);
});

it('공지·인증·회의·잠금·제출 endpoint에 전역 prefix를 정확히 한 번 적용한다', () => {
  expect(ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST('1')).toBe(
    '/api/v1/sections/1/announcements',
  );
  expect(ENDPOINTS.ANNOUNCEMENTS.DETAIL(10)).toBe('/api/v1/announcements/10');
  expect(ENDPOINTS.AUTH.LOGIN).toBe('/api/v1/auth/login');
  expect(ENDPOINTS.AUTH.REFRESH).toBe('/api/v1/auth/refresh');
  expect(ENDPOINTS.MEETING.RECORD('10')).toBe('/api/v1/meeting-records/10');
  expect(ENDPOINTS.EDIT_LOCKS.ROOT).toBe('/api/v1/edit-locks');
  expect(ENDPOINTS.SUBMISSION.DETAIL('10')).toBe('/api/v1/submissions/10');
  function check(value: unknown) {
    if (typeof value === 'function') check(value('1', '2', '3'));
    else if (typeof value === 'string') {
      expect(value.startsWith('/api/v1/')).toBe(true);
      expect(value.match(/\/api\/v1/g)).toHaveLength(1);
      expect(value).not.toContain('/oop/');
    } else if (value && typeof value === 'object')
      Object.values(value).forEach(check);
  }
  check(ENDPOINTS);
});
