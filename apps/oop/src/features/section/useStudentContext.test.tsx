import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
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
import { useMeetingRecordQuery } from '~/features/meeting/queries/useMeetingRecordQuery';
import { useStudentMeetingListQuery } from '~/features/meeting/queries/useStudentMeetingListQuery';
import { useTeamActionPlanQuery } from '~/features/meeting/queries/useTeamActionPlanQuery';

import { useStudentContext } from './useStudentContext';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';

const section = {
  id: 1,
  code: 'OOP-01',
  name: '01분반',
  classTime: '',
  capacity: 40,
  contactVisibleFrom: null,
  contactVisibleUntil: null,
  courseId: 1,
  courseName: 'OOP',
  year: 2026,
  semester: 'FALL',
  status: 'ACTIVE',
};
const second = { ...section, id: 2, code: 'OOP-02', name: '02분반' };
let sections = [section, second];
let memberships = [section, second];
let identityFails = false;
let teamId: number | null = 7;
const calls: string[] = [];
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
    identityFails
      ? HttpResponse.json({}, { status: 500 })
      : HttpResponse.json({
          studentNumber: 'context-student',
          name: '학생',
          email: '',
          phone: '',
          globalRole: 'USER',
          teamId,
          sections: memberships,
        }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
    HttpResponse.json({ contents: sections }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () =>
    HttpResponse.json({ id: 7, name: '7팀', members: [] }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.RECORDS('7')}`, () =>
    HttpResponse.json({ contents: [] }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.ACTIONS('7')}`, () =>
    HttpResponse.json({ contents: [] }),
  ),
);
const clients: QueryClient[] = [];
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) =>
    calls.push(new URL(request.url).pathname),
  );
});
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  useAuthStore.getState().markAuthenticated('STUDENT');
  sections = [section, second];
  memberships = [section, second];
  identityFails = false;
  teamId = 7;
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore
    .getState()
    .setCurrentUser({ ...demoStudent, studentNumber: 'context-student' });
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  calls.length = 0;
  useAuthStore.getState().clearSession();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());
function setup(withDetail = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    client,
    ...renderHook(
      () => ({
        context: useStudentContext(),
        list: useStudentMeetingListQuery(),
        detail: useMeetingRecordQuery(withDetail ? '19' : undefined),
        actions: useTeamActionPlanQuery(),
      }),
      { wrapper },
    ),
  };
}
const dependentCalls = () =>
  calls.filter(
    path =>
      path !== ENDPOINTS.USER.ME && path !== ENDPOINTS.SECTION.MY_SECTIONS,
  );

it('selects and switches sections without attributing a scalar team or issuing dependent requests, even on retry', async () => {
  const { result } = setup(true);
  await waitFor(() =>
    expect(result.current.context.status).toBe('selection-required'),
  );
  expect(dependentCalls()).toEqual([]);
  act(() => result.current.context.selectSection(1));
  expect(result.current.context.status).toBe('ambiguous');
  expect(result.current.context.section?.id).toBe(1);
  await act(async () => {
    await result.current.list.refetch();
    await result.current.detail.refetch();
    await result.current.actions.refetch();
  });
  expect(dependentCalls()).toEqual([]);
  act(() => result.current.context.selectSection(2));
  expect(result.current.context.section?.id).toBe(2);
  expect(result.current.context.teamId).toBeUndefined();
  expect(dependentCalls()).toEqual([]);
});

it('blocks team requests when only one active section remains but /me still lists multiple memberships', async () => {
  sections = [section];
  const { result } = setup(true);
  await waitFor(() => expect(result.current.context.status).toBe('ambiguous'));
  expect(dependentCalls()).toEqual([]);
});

it('suppresses stale identifiers on prerequisite failure and retries the prerequisites', async () => {
  memberships = [section];
  sections = [section];
  teamId = null;
  const { result } = setup();
  await waitFor(() => expect(result.current.context.status).toBe('no-team'));
  identityFails = true;
  await act(async () => {
    await result.current.context.retry();
  });
  await waitFor(() => expect(result.current.context.status).toBe('error'));
  expect(result.current.context.section).toBeUndefined();
  expect(result.current.context.teamId).toBeUndefined();
  expect(dependentCalls()).toEqual([]);
  identityFails = false;
  await act(async () => {
    await result.current.context.retry();
  });
  await waitFor(() => expect(result.current.context.status).toBe('no-team'));
});

it('waits for successful kickoff with the matching team ID before list/action requests', async () => {
  memberships = [section];
  sections = [section];
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () =>
      HttpResponse.json({}, { status: 500 }),
    ),
  );
  const { result } = setup();
  await waitFor(() => expect(result.current.list.context.isError).toBe(true));
  expect(dependentCalls()).toEqual([ENDPOINTS.TEAM.KICKOFF('7')]);
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () =>
      HttpResponse.json({ id: 8, name: '다른 팀', members: [] }),
    ),
  );
  await act(async () => {
    await result.current.list.refetch();
  });
  expect(result.current.list.context.isError).toBe(true);
  expect(result.current.list.teamId).toBeUndefined();
  expect(
    dependentCalls().every(path => path === ENDPOINTS.TEAM.KICKOFF('7')),
  ).toBe(true);
  server.resetHandlers();
  await act(async () => {
    await result.current.list.refetch();
  });
  await waitFor(() => expect(result.current.list.items).toEqual([]));
  expect(result.current.list.teamId).toBe('7');
});
