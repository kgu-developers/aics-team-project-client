import {
  API_BASE_URL,
  ENDPOINTS,
  type RequiredArtifactsResponse,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAdminRequiredArtifactsQuery } from './useAdminRequiredArtifactsQuery';

const request = vi.fn();
const response: RequiredArtifactsResponse = {
  contents: [
    {
      allowedExtensions: ['pdf'],
      id: 1001,
      label: '프로젝트 제안서',
      maxFileSizeMb: 20,
      required: true,
      type: 'FILE',
    },
  ],
};
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS('1', '101')}`,
    () => {
      request();
      return HttpResponse.json(response);
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  request.mockClear();
  server.resetHandlers();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useAdminRequiredArtifactsQuery', () => {
  it('분반 또는 마일스톤 ID가 없으면 목록을 요청하지 않는다', () => {
    const { result } = renderHook(
      () => useAdminRequiredArtifactsQuery('1', undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(request).not.toHaveBeenCalled();
  });

  it('분반과 마일스톤 ID로 필수 산출물 목록을 조회한다', async () => {
    const { result } = renderHook(
      () => useAdminRequiredArtifactsQuery('1', '101'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(request).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(response);
  });
});
