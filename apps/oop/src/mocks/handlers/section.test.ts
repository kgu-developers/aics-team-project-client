import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { MySectionsResponse } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { sectionHandlers } from './section';
import { resetMockSessionState } from '../authSession';
import { demoAccessToken } from '../data/users';

const server = setupServer(...sectionHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
});
afterAll(() => server.close());

function fetchMySections(query = '') {
  return fetch(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}${query}`, {
    headers: { Cookie: `accessToken=${demoAccessToken}` },
  });
}

describe('sectionHandlers', () => {
  it('인증 쿠키가 없으면 내 분반 목록을 노출하지 않는다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`,
    );

    expect(response.status).toBe(401);
  });

  it('실서버 SectionListResponse wrapper와 numeric id shape를 응답한다', async () => {
    const response = await fetchMySections();
    const body = (await response.json()) as MySectionsResponse;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      contents: [
        expect.objectContaining({
          id: 1,
          code: 'CS101',
          courseId: 1,
          courseName: '객체지향프로그래밍',
          semester: 'SPRING',
          status: 'ACTIVE',
          year: 2026,
        }),
      ],
    });
    expect(response.headers.get('set-cookie')).toContain('XSRF-TOKEN=');
  });

  it('status/year/semester 필터를 모두 적용한다', async () => {
    const matching = await fetchMySections(
      '?status=ACTIVE&year=2026&semester=SPRING',
    );
    const notMatching = await fetchMySections('?semester=FALL');

    await expect(matching.json()).resolves.toMatchObject({
      contents: [expect.objectContaining({ id: 1 })],
    });
    await expect(notMatching.json()).resolves.toEqual({ contents: [] });
  });

  it('지원하지 않는 enum 필터는 INVALID_INPUT 400을 응답한다', async () => {
    const response = await fetchMySections('?status=UNKNOWN');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code: 'INVALID_INPUT' });
  });
});
