import { API_BASE_URL, setApiAccessToken } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { useAdminNoticesQuery } from './useAdminNoticesQuery';

import { demoNoticeProfessor } from '~/mocks/data/users';

const request = vi.fn();
const notice = {
  id: 10,
  sectionId: 1,
  title: '공지',
  content: '내용',
  publishedAt: '2026-08-27 15:00',
};
const server = setupServer(
  http.get(
    `${API_BASE_URL}/api/v1/sections/:sectionId/announcements`,
    ({ params }) => {
      request(params.sectionId);
      return HttpResponse.json({ contents: [notice] });
    },
  ),
);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => useAuthStore.setState({ currentUser: demoNoticeProfessor }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  request.mockClear();
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ currentUser: null });
});
afterAll(() => server.close());
function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}
it('정확한 contents 계약으로 분반 목록을 읽고 로그인 사용자별 캐시를 분리한다', async () => {
  const { result } = renderHook(() => useAdminNoticesQuery(1), {
    wrapper: wrapper(),
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual([notice]);
  expect(request).toHaveBeenCalledExactlyOnceWith('1');
  await act(() =>
    useAuthStore.setState({
      currentUser: { ...demoNoticeProfessor, id: 'another-professor' },
    }),
  );
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
});
it.each([undefined, 0, -1, NaN, 2])(
  '유효한 담당 분반 %s가 없으면 요청하지 않는다',
  async sectionId => {
    const { result } = renderHook(() => useAdminNoticesQuery(sectionId), {
      wrapper: wrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    await act(() => result.current.refetch());
    expect(request).not.toHaveBeenCalled();
  },
);
