import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminPeerEvaluationFormCreateInput,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useCreateAdminPeerEvaluationFormMutation } from './useCreateAdminPeerEvaluationFormMutation';

const input: AdminPeerEvaluationFormCreateInput = {
  anonymous: true,
  closesAt: '2026-10-08T23:59:59',
  milestoneId: 10,
  opensAt: '2026-10-01T09:00:00',
};
const server = setupServer(
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_FORM(1)}`,
    async ({ request }) => {
      expect(await request.json()).toEqual(input);
      return HttpResponse.json({ id: 99 }, { status: 201 });
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCreateAdminPeerEvaluationFormMutation', () => {
  it('분반의 마일스톤 상호평가 양식을 생성한다', async () => {
    const { result } = renderHook(
      () => useCreateAdminPeerEvaluationFormMutation(),
      {
        wrapper: createWrapper(),
      },
    );

    result.current.mutate({ input, sectionId: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 99 });
  });

  it('서버 오류를 mutation 오류 상태로 전달한다', async () => {
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_FORM(1)}`,
        () =>
          HttpResponse.json(
            { message: '생성할 수 없습니다.' },
            { status: 403 },
          ),
      ),
    );

    const { result } = renderHook(
      () => useCreateAdminPeerEvaluationFormMutation(),
      {
        wrapper: createWrapper(),
      },
    );
    result.current.mutate({ input, sectionId: 1 });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
