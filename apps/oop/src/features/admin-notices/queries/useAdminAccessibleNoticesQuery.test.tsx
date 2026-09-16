import { API_BASE_URL, setApiAccessToken } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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

import { useAdminAccessibleNoticesQuery } from './useAdminAccessibleNoticesQuery';

import { demoNoticeProfessor } from '~/mocks/data/users';

const request = vi.fn();
const notice = (id: number, sectionId: number, publishedAt: string) => ({
  id,
  sectionId,
  publishedAt,
  title: `공지 ${id}`,
  content: '본문',
});
const server = setupServer(
  http.get(
    `${API_BASE_URL}/api/v1/sections/:sectionId/announcements`,
    ({ params }) => {
      request(params.sectionId);
      return HttpResponse.json({
        contents: [
          notice(
            Number(params.sectionId),
            Number(params.sectionId),
            '2026-09-14T10:00:00Z',
          ),
        ],
      });
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
function renderQuery() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  return renderHook(() => useAdminAccessibleNoticesQuery(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
function setSections(sections: typeof demoNoticeProfessor.sections) {
  useAuthStore.setState({ currentUser: { ...demoNoticeProfessor, sections } });
}
const section = demoNoticeProfessor.sections[0]!;

it('requests each valid ACTIVE section once and excludes inactive, unknown-status and invalid scopes', async () => {
  setSections([
    section,
    section,
    { ...section, id: '2', status: 'ARCHIVED' },
    { ...section, id: '3', status: undefined },
    { ...section, id: 'bad' },
  ]);
  const { result } = renderQuery();
  await waitFor(() => expect(result.current.isPending).toBe(false));
  expect(request).toHaveBeenCalledExactlyOnceWith('1');
  expect(result.current.data).toHaveLength(1);
  expect(result.current.isError).toBe(false);
  expect(result.current.scopeStatus).toBe('unknown-status');
});

it.each(['no user', 'no active sections', 'no sections'] as const)(
  'does not request without a usable scope: %s',
  async scenario => {
    if (scenario === 'no user') useAuthStore.setState({ currentUser: null });
    else if (scenario === 'no sections') setSections([]);
    else setSections([{ ...section, status: 'ARCHIVED' }]);
    const { result } = renderQuery();
    expect(result.current).toEqual({
      data: [],
      isPending: false,
      isError: false,
      scopeStatus: 'no-active-sections',
    });
    expect(request).not.toHaveBeenCalled();
  },
);

it('reports missing section status as a prerequisite and waits for confirmed ACTIVE status before requesting', async () => {
  setSections([{ ...section, status: undefined }]);
  const { result } = renderQuery();
  expect(result.current).toEqual({
    data: [],
    isPending: false,
    isError: false,
    scopeStatus: 'unknown-status',
  });
  expect(request).not.toHaveBeenCalled();

  setSections([section]);
  await waitFor(() => {
    expect(result.current.scopeStatus).toBe('ready');
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toHaveLength(1);
  });
  expect(request).toHaveBeenCalledExactlyOnceWith('1');
});

it('distinguishes a successfully fetched empty ACTIVE section from missing prerequisites', async () => {
  server.use(
    http.get(`${API_BASE_URL}/api/v1/sections/1/announcements`, () => {
      request('1');
      return HttpResponse.json({ contents: [] });
    }),
  );
  const { result } = renderQuery();
  await waitFor(() => expect(result.current.isPending).toBe(false));
  expect(request).toHaveBeenCalledExactlyOnceWith('1');
  expect(result.current).toEqual({
    data: [],
    isPending: false,
    isError: false,
    scopeStatus: 'ready',
  });
});

it('keeps successful notices and reports a failed active section', async () => {
  setSections([section, { ...section, id: '2' }]);
  server.use(
    http.get(
      `${API_BASE_URL}/api/v1/sections/2/announcements`,
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  const { result } = renderQuery();
  await waitFor(() => {
    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(true);
  });
  expect(result.current.data.map(item => item.id)).toEqual([1]);
});

it('reports a total failure without inventing successful notices', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}/api/v1/sections/1/announcements`,
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  const { result } = renderQuery();
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.isPending).toBe(false);
  expect(result.current.data).toEqual([]);
});

it('sorts mixed Seoul, UTC and offset timestamps by instant, keeping invalid dates last', async () => {
  setSections([section, { ...section, id: '2' }]);
  const first = [
    notice(1, 1, '2026-09-14 23:00'),
    notice(2, 1, '2026-09-14T13:00:00Z'),
    notice(5, 1, 'invalid'),
  ];
  const second = [
    notice(3, 2, '2026-09-14T23:30:00+09:00'),
    notice(4, 2, '2026-09-15T00:00:00+10:00'),
    notice(6, 2, ''),
    notice(7, 2, '2026-09-15'),
    notice(8, 2, '2026-09-14T16:00:00Z'),
  ];
  server.use(
    http.get(
      `${API_BASE_URL}/api/v1/sections/:sectionId/announcements`,
      ({ params }) =>
        HttpResponse.json({
          contents: params.sectionId === '1' ? first : second,
        }),
    ),
  );
  const { result } = renderQuery();
  await waitFor(() => expect(result.current.isPending).toBe(false));
  expect(result.current.data.map(item => item.id)).toEqual([
    8, 7, 3, 1, 4, 2, 5, 6,
  ]);
  expect(first.map(item => item.id)).toEqual([1, 2, 5]);
  expect(second.map(item => item.id)).toEqual([3, 4, 6, 7, 8]);
});
