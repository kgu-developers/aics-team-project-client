import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { SectionResponse } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { studentHomeKeys } from '~/features/student-home/queries/studentHomeKeys';

import LiveTeamAssignmentFlow from './LiveTeamAssignmentFlow';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Navigate: () => null,
}));

const section: SectionResponse = {
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
const server = setupServer();
const clients: QueryClient[] = [];
const requests: Array<{ method: string; path: string }> = [];
let identitySequence = 0;
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) =>
    requests.push({ method: request.method, path: requestPath(request.url) }),
  );
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  requests.length = 0;
  mockNavigate.mockReset();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
const surveyPath = (id: string) =>
  `${ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE}?sectionId=${id}`;
function requestPath(url: string) {
  const parsed = new URL(url);
  return parsed.pathname === ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE
    ? `${parsed.pathname}${parsed.search}`
    : parsed.pathname;
}
const dependentRequests = () =>
  requests.filter(
    ({ path }) =>
      path !== ENDPOINTS.USER.ME && path !== ENDPOINTS.SECTION.MY_SECTIONS,
  );

function setup({
  memberships = [section, second],
  activeSections = [section, second],
  teamId = null,
  gate = Promise.resolve(),
  authenticated = true,
  identityStatus = 200,
}: {
  memberships?: SectionResponse[];
  activeSections?: SectionResponse[];
  teamId?: number | null;
  gate?: Promise<void>;
  authenticated?: boolean;
  identityStatus?: number;
} = {}) {
  const studentNumber = `onboarding-context-${++identitySequence}`;
  if (authenticated) {
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().markAuthenticated('STUDENT');
  }
  useAuthStore
    .getState()
    .setCurrentUser({ ...demoStudent, id: studentNumber, studentNumber });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, async () => {
      await gate;
      if (identityStatus !== 200) {
        return HttpResponse.json({}, { status: identityStatus });
      }
      return HttpResponse.json({
        studentNumber,
        name: '학생',
        email: '',
        phone: '',
        globalRole: 'USER',
        teamId,
        sections: memberships,
      });
    }),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: activeSections }),
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE}`,
      () => HttpResponse.json({}, { status: 404 }),
    ),
  );
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <LiveTeamAssignmentFlow />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return { client, studentNumber };
}

async function selectSection(name: string) {
  await userEvent.click(
    screen.getByRole('combobox', { name: '수강 분반 선택' }),
  );
  await userEvent.click(screen.getByRole('option', { name }));
}

it('offers re-login with disabled pending identity queries and clears stale local identity without requests', async () => {
  const { client, studentNumber } = setup({ authenticated: false });
  expect(
    client.getQueryState(studentHomeKeys.user(studentNumber, null)),
  ).toMatchObject({ status: 'pending', fetchStatus: 'idle' });
  expect(useAuthStore.getState()).toMatchObject({
    isAuthenticated: false,
    currentUser: { studentNumber },
  });
  expect(screen.getByText('로그인 정보를 확인해 주세요.')).toBeVisible();
  expect(
    screen.queryByText('소속 분반과 팀 정보를 확인하는 중이에요.'),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '다시 확인' }),
  ).not.toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole('button', { name: '다시 로그인' }));

  expect(useAuthStore.getState()).toMatchObject({
    isAuthenticated: false,
    sessionRole: null,
    accessToken: null,
    currentUser: null,
  });
  expect(mockNavigate).toHaveBeenCalledExactlyOnceWith({ to: '/login' });
  expect(requests).toEqual([]);
});

it.each([401, 500])(
  'offers re-login after identity HTTP %s and clears the local session without dependent requests',
  async identityStatus => {
    const { client, studentNumber } = setup({ identityStatus });
    await screen.findByText('로그인 정보를 확인해 주세요.');
    expect(
      client.getQueryState(studentHomeKeys.user(studentNumber, 'STUDENT')),
    ).toMatchObject({
      status: 'error',
      error: { response: { status: identityStatus } },
    });
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      sessionRole: 'STUDENT',
      accessToken: demoAccessToken,
      currentUser: { studentNumber },
    });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(dependentRequests()).toEqual([]);

    await userEvent.click(screen.getByRole('button', { name: '다시 로그인' }));

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      sessionRole: null,
      accessToken: null,
      currentUser: null,
    });
    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith({ to: '/login' });
    expect(dependentRequests()).toEqual([]);
  },
);

it('waits for identity and selection, then reads and submits a survey only for the selected membership', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  setup({ gate });
  await screen.findByText('소속 분반과 팀 정보를 확인하는 중이에요.');
  expect(dependentRequests()).toEqual([]);
  await act(async () => release());
  await screen.findByText('수강 분반을 선택해 주세요.');
  expect(dependentRequests()).toEqual([]);
  await selectSection('OOP 02분반');
  await screen.findByRole('button', { name: '시작하기' });
  expect(dependentRequests()).toEqual([
    { method: 'GET', path: surveyPath('2') },
  ]);
  const writes: string[] = [];
  server.use(
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.SUBMIT_SURVEY_RESPONSE(':sectionId')}`,
      ({ params }) => {
        writes.push(String(params.sectionId));
        return HttpResponse.json({
          id: 1,
          sectionId: Number(params.sectionId),
          userId: 'student',
          preferredRoles: ['DEVELOPMENT'],
          submittedAt: '2026-09-01T10:00:00Z',
        });
      },
    ),
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '시작하기' }));
  await user.click(screen.getByLabelText('개발'));
  await user.click(screen.getByRole('button', { name: '다음 설문' }));
  await user.type(
    screen.getByLabelText(/프로젝트 주제 아이디어/),
    '분반별 일정',
  );
  await user.click(screen.getByRole('button', { name: '설문 제출' }));
  await user.click(
    within(screen.getByRole('dialog', { name: '설문 제출 확인' })).getByRole(
      'button',
      { name: '제출' },
    ),
  );
  await screen.findByRole('heading', {
    name: '설문에 응답해 주셔서 감사합니다.',
  });
  expect(writes).toEqual(['2']);
  await selectSection('OOP 01분반');
  await screen.findByRole('button', { name: '시작하기' });
  expect(dependentRequests().map(row => row.path)).toEqual([
    surveyPath('2'),
    ENDPOINTS.TEAM_ASSIGNMENT.SUBMIT_SURVEY_RESPONSE('2'),
    surveyPath('1'),
  ]);
});

it('keeps the selector reachable and sends no dependent request for ambiguous teams across selection and retry', async () => {
  setup({ teamId: 7 });
  await screen.findByText('수강 분반을 선택해 주세요.');
  expect(dependentRequests()).toEqual([]);
  await selectSection('OOP 02분반');
  await screen.findByText(/선택한 분반의 팀 소속을 확인할 수 없어요/);
  await userEvent.click(
    screen.getByRole('button', { name: '소속 정보 다시 시도' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '소속 정보 다시 시도' }),
    ).toBeEnabled(),
  );
  await selectSection('OOP 01분반');
  expect(
    screen.getByRole('combobox', { name: '수강 분반 선택' }),
  ).toHaveTextContent('OOP 01분반');
  expect(dependentRequests()).toEqual([]);
  expect(
    screen.queryByRole('button', { name: '시작하기' }),
  ).not.toBeInTheDocument();
});

it('does not attribute a scalar team when only one of multiple memberships is active', async () => {
  setup({ activeSections: [second], teamId: 7 });
  await screen.findByText(/선택한 분반의 팀 소속을 확인할 수 없어요/);
  expect(dependentRequests()).toEqual([]);
});

it.each([null, 7])(
  'does not request a survey or team from an unrelated section (team %s)',
  async teamId => {
    setup({ memberships: [section], activeSections: [second], teamId });
    await screen.findByText('소속 분반이 없어요.');
    await userEvent.click(
      screen.getByRole('button', { name: '소속 정보 다시 시도' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '소속 정보 다시 시도' }),
      ).toBeEnabled(),
    );
    expect(dependentRequests()).toEqual([]);
  },
);

it('hides the survey after a prerequisite refetch fails and recovers with the selector still available', async () => {
  const { client } = setup();
  await screen.findByText('수강 분반을 선택해 주세요.');
  await selectSection('OOP 02분반');
  await screen.findByRole('button', { name: '시작하기' });
  requests.length = 0;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({}, { status: 500 }),
    ),
  );
  await act(async () => {
    await client.invalidateQueries({ queryKey: studentHomeKeys.users() });
  });
  await screen.findByText('로그인 정보를 확인해 주세요.');
  expect(dependentRequests()).toEqual([]);
  expect(
    screen.queryByRole('button', { name: '시작하기' }),
  ).not.toBeInTheDocument();
  server.resetHandlers();
  // Restore a fresh authoritative identity after the failed refetch.
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({
        studentNumber: `onboarding-context-${identitySequence}`,
        name: '학생',
        globalRole: 'USER',
        teamId: null,
        sections: [section, second],
      }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: [section, second] }),
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE}`,
      () => HttpResponse.json({}, { status: 404 }),
    ),
  );
  await userEvent.click(screen.getByRole('button', { name: '다시 확인' }));
  await screen.findByRole('button', { name: '시작하기' });
  expect(
    screen.getByRole('combobox', { name: '수강 분반 선택' }),
  ).toHaveTextContent('OOP 02분반');
  expect(dependentRequests()).toEqual([
    { method: 'GET', path: surveyPath('2') },
  ]);
});

it('requests only the attributed kickoff and rejects a mismatched returned team', async () => {
  setup({
    memberships: [second],
    activeSections: [section, second],
    teamId: 7,
  });
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () =>
      HttpResponse.json({ id: 8, name: '다른 팀', members: [] }),
    ),
  );
  await screen.findByText('배정된 팀 정보를 확인하지 못했어요.');
  expect(dependentRequests()).toEqual([
    { method: 'GET', path: ENDPOINTS.TEAM.KICKOFF('7') },
  ]);
  expect(
    screen.queryByRole('button', { name: '시작하기' }),
  ).not.toBeInTheDocument();
});
