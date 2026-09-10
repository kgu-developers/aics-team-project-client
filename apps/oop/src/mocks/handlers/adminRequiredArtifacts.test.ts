import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { resetMockSessionState } from '../authSession';
import { adminRequiredArtifactHandlers } from './adminRequiredArtifacts';
import { resetAdminRequiredArtifactsFixture } from '../data/adminRequiredArtifacts';
import { demoAdminAccessToken } from '../data/users';

const server = setupServer(...adminRequiredArtifactHandlers);
const headers = {
  Authorization: `Bearer ${demoAdminAccessToken}`,
  'Content-Type': 'application/json',
};
const endpoint = ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS('1', '101');

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetAdminRequiredArtifactsFixture();
});
afterEach(() => {
  server.resetHandlers();
  resetMockSessionState();
});
afterAll(() => server.close());

it('필수 산출물을 등록·수정·삭제하고 목록에 반영한다', async () => {
  const createResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
    body: JSON.stringify({
      allowedExtensions: ['pdf', 'zip'],
      label: '발표 자료',
      maxFileSizeMb: 30,
      required: true,
      type: 'FILE',
    }),
    headers,
    method: 'POST',
  });
  const created = (await createResponse.json()) as { id: number };

  expect(createResponse.status).toBe(201);

  const updateResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.REQUIRED_ARTIFACT('1', '101', String(created.id))}`,
    {
      body: JSON.stringify({
        label: '발표 시연 링크',
        required: false,
        type: 'LINK',
      }),
      headers,
      method: 'PUT',
    },
  );
  expect(updateResponse.status).toBe(204);

  const listResponse = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  const list = (await listResponse.json()) as {
    contents: Array<{
      allowedExtensions?: string[];
      id: number;
      maxFileSizeMb?: number;
      type: string;
    }>;
  };
  expect(list.contents).toContainEqual({
    id: created.id,
    label: '발표 시연 링크',
    required: false,
    type: 'LINK',
  });

  const updated = list.contents.find(artifact => artifact.id === created.id);
  expect(updated?.allowedExtensions).toBeUndefined();
  expect(updated?.maxFileSizeMb).toBeUndefined();

  const deleteResponse = await fetch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.REQUIRED_ARTIFACT('1', '101', String(created.id))}`,
    { headers, method: 'DELETE' },
  );
  expect(deleteResponse.status).toBe(204);

  const afterDeleteResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
  });
  const afterDelete = (await afterDeleteResponse.json()) as {
    contents: Array<{ id: number }>;
  };
  expect(afterDeleteResponse.status).toBe(200);
  expect(afterDelete.contents).not.toContainEqual({ id: created.id });
});

it('관리자 인증이 없으면 산출물 목록을 조회할 수 없다', async () => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  expect(response.status).toBe(401);
});
