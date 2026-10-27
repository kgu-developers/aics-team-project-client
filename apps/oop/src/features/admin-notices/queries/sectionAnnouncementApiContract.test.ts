import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

import {
  API_BASE_URL,
  ENDPOINTS,
  fetchSectionAnnouncements,
  submitSectionAnnouncement,
  updateSectionAnnouncement,
} from '@aics/api-client';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

const server = setupServer();
beforeAll(async () => {
  const nativeForm = await new Response('', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).formData();
  vi.stubGlobal('FormData', nativeForm.constructor);
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', NodeFile);
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
const announcement = {
  id: 10,
  sectionId: 1,
  title: '공지',
  content: '본문',
  publishedAt: '2026-09-16T09:00:00',
};

async function readRequestPart(formData: FormData) {
  const requestPart = formData.get('request');
  if (requestPart == null) throw new Error('request 파트가 없습니다.');
  return JSON.parse(
    typeof requestPart === 'string' ? requestPart : await requestPart.text(),
  );
}

it('GET/POST/PATCH는 multipart request/files 파트와 contents/단일 응답 계약을 사용한다', async () => {
  const requests: Array<{
    contentType: string | null;
    files: string[];
    request: unknown;
  }> = [];
  server.use(
    http.get(`${API_BASE_URL}/api/v1/sections/1/announcements`, () =>
      HttpResponse.json({ contents: [announcement] }),
    ),
    http.post(
      `${API_BASE_URL}/api/v1/sections/1/announcements`,
      async ({ request }) => {
        const formData = await request.formData();
        requests.push({
          contentType: request.headers.get('content-type'),
          files: formData
            .getAll('files')
            .filter((part): part is File => part instanceof File)
            .map(file => file.name),
          request: await readRequestPart(formData),
        });
        return HttpResponse.json(announcement, { status: 201 });
      },
    ),
    http.patch(
      `${API_BASE_URL}/api/v1/announcements/10`,
      async ({ request }) => {
        const formData = await request.formData();
        const input = await readRequestPart(formData);
        requests.push({
          contentType: request.headers.get('content-type'),
          files: formData
            .getAll('files')
            .filter((part): part is File => part instanceof File)
            .map(file => file.name),
          request: input,
        });
        const updatedFields = Object.fromEntries(
          Object.entries(input as Record<string, unknown>).filter(
            ([key]) => key !== 'deleteAttachmentIds',
          ),
        );
        return HttpResponse.json({ ...announcement, ...updatedFields });
      },
    ),
  );
  expect(await fetchSectionAnnouncements('1')).toEqual([announcement]);
  expect(
    await submitSectionAnnouncement(1, {
      title: '공지',
      content: '본문',
      files: [new File(['guide'], '안내.pdf', { type: 'application/pdf' })],
    }),
  ).toEqual(announcement);
  expect(
    await updateSectionAnnouncement('10', {
      content: '수정',
      deleteAttachmentIds: [4],
      files: [new File(['revised'], '수정본.pdf', { type: 'application/pdf' })],
    }),
  ).toEqual({ ...announcement, content: '수정' });
  expect(requests).toEqual([
    {
      contentType: expect.stringContaining('multipart/form-data'),
      files: ['안내.pdf'],
      request: { title: '공지', content: '본문' },
    },
    {
      contentType: expect.stringContaining('multipart/form-data'),
      files: ['수정본.pdf'],
      request: { content: '수정', deleteAttachmentIds: [4] },
    },
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
