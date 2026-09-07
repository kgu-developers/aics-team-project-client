import { API_BASE_URL, fetchMeetingRecordDetail } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
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

import {
  MeetingDetailPage,
  MeetingEditPage,
  MeetingNewPage,
} from './MeetingPages';

import { meetingApiRecord, meetingApiTeam } from '~/mocks/data/meetingApi';
import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoPartnerStudent,
  demoStudent,
} from '~/mocks/data/users';
import { createMeetingApiHandlers } from '~/mocks/handlers/meetingApi';
import { renderWithRouter } from '~/test/renderWithRouter';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => navigate,
}));
const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore
    .getState()
    .setCurrentUser({ ...demoStudent, teamId: '7', currentTeam: null });
  server.use(
    ...createMeetingApiHandlers(),
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () =>
      HttpResponse.json(meetingApiTeam),
    ),
  );
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  server.events.removeAllListeners();
  useAuthStore.getState().clearSession();
  vi.unstubAllEnvs();
  navigate.mockReset();
});
afterAll(() => server.close());
function renderPage(page = <MeetingDetailPage meetingId='19' />) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return renderWithRouter(
    <QueryClientProvider client={client}>
      <AstryxThemeProvider>
        {page}
        <ToastViewport />
      </AstryxThemeProvider>
    </QueryClientProvider>,
  );
}

it('상세와 기존 액션을 읽기 전용으로 표시하고 수정·상태 변경을 제공하지 않는다', async () => {
  renderPage();
  expect(
    await screen.findByRole('heading', { name: '진행 점검 회의' }),
  ).toBeVisible();
  expect(
    screen.getByText('지난 회의의 결정 사항을 확인했습니다.'),
  ).toBeVisible();
  expect(screen.getAllByText('OOP 데모 학생 B').length).toBeGreaterThan(0);
  expect(screen.getByText('회의록 상세 화면 검증')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: '수정' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '액션 추가' }),
  ).not.toBeInTheDocument();
});

it('실 API에서 수정 URL에 직접 진입해도 편집 폼과 저장 요청을 제공하지 않는다', async () => {
  const writes = vi.fn();
  server.events.on('request:start', ({ request }) => {
    if (request.method !== 'GET') writes();
  });
  renderPage(<MeetingEditPage meetingId='19' />);
  expect(await screen.findByText('회의록 수정은 준비 중이에요.')).toBeVisible();
  expect(
    screen.queryByRole('textbox', { name: /회의 제목/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '저장' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: '회의록 상세로 돌아가기' }),
  ).toHaveAttribute('href', '/student/meetings/19');
  expect(writes).not.toHaveBeenCalled();
});

async function fillNewMeeting() {
  const user = userEvent.setup();
  renderPage(<MeetingNewPage />);
  const title = await screen.findByRole('textbox', { name: /회의 제목/ });
  await user.type(title, '새 회의록 검증');
  const date = screen.getByRole('combobox', { name: /회의 일자/ });
  fireEvent.change(date, { target: { value: '2026-09-08' } });
  fireEvent.blur(date);
  const time = screen.getByRole('textbox', { name: /회의 시간/ });
  fireEvent.change(time, { target: { value: '00:30' } });
  fireEvent.blur(time);
  await user.click(screen.getByRole('button', { name: /참석자/ }));
  await user.click(
    await screen.findByRole('option', { name: 'OOP 데모 학생 A' }),
  );
  await user.keyboard('{Escape}');
  return user;
}

it('실 API 생성 폼은 액션 테이블을 비활성 상태로 유지하고 회의록만 한 번 등록한다', async () => {
  const writes: { method: string; url: string }[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method !== 'GET')
      writes.push({ method: request.method, url: request.url });
  });
  const user = await fillNewMeeting();
  const actions = screen.getByRole('region', { name: '액션 플랜' });
  expect(within(actions).getByRole('table')).toBeVisible();
  expect(
    within(actions).getByRole('button', { name: '액션 추가' }),
  ).toBeDisabled();
  expect(
    within(actions).getByText('액션 플랜 등록은 준비 중이에요.'),
  ).toBeVisible();
  await user.click(within(actions).getByRole('button', { name: '액션 추가' }));
  expect(within(actions).queryByRole('textbox')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '등록' }));
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith({
      to: '/student/meetings/$meetingId',
      params: { meetingId: '20' },
    }),
  );
  expect(writes).toEqual([
    { method: 'POST', url: `${API_BASE_URL}/teams/7/meeting-records` },
  ]);
  expect(await fetchMeetingRecordDetail('20')).toMatchObject({
    title: '새 회의록 검증',
    meetingAt: '2026-09-08T00:30:00',
    participantIds: ['20260001'],
  });
});

it.each([400, 503])(
  '생성 %s 실패 시 입력을 유지하며 성공 여부가 불확실하면 재등록을 막는다',
  async status => {
    server.use(
      http.post(
        `${API_BASE_URL}/teams/7/meeting-records`,
        () => new HttpResponse(null, { status }),
      ),
    );
    const user = await fillNewMeeting();
    await user.click(screen.getByRole('button', { name: '등록' }));
    await waitFor(() =>
      expect(
        screen
          .getAllByRole('alert')
          .some(alert =>
            alert.textContent?.includes(
              status === 503
                ? '저장 결과를 확인할 수 없어요'
                : '회의록을 저장하지 못했어요',
            ),
          ),
      ).toBe(true),
    );
    expect(screen.getByRole('textbox', { name: /회의 제목/ })).toHaveValue(
      '새 회의록 검증',
    );
    expect(navigate).not.toHaveBeenCalled();
    const button = screen.getByRole('button', { name: '등록' });
    if (status === 503) {
      expect(button).toBeDisabled();
      expect(
        screen.getByRole('link', { name: '회의록 목록 확인' }),
      ).toBeVisible();
    } else expect(button).toBeEnabled();
  },
);

it('팀원은 작성자와 달라도 회의록 전체 삭제를 확인 후 실행할 수 있다', async () => {
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  useAuthStore
    .getState()
    .setCurrentUser({ ...demoPartnerStudent, teamId: '7', currentTeam: null });
  const user = userEvent.setup();
  renderPage();
  await user.click(await screen.findByRole('button', { name: '삭제' }));
  const dialog = await screen.findByRole('dialog', {
    name: '회의록 삭제 확인',
  });
  await user.click(within(dialog).getByRole('button', { name: '삭제' }));
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith({ to: '/student/meetings' }),
  );
  await expect(fetchMeetingRecordDetail('19')).rejects.toMatchObject({
    response: { status: 404 },
  });
});

it.each([403, 404, 500])(
  '상세 %s 오류는 찾을 수 없는 화면으로 안내하고 편집 버튼을 표시하지 않는다',
  async status => {
    server.use(
      http.get(
        `${API_BASE_URL}/meeting-records/19`,
        () => new HttpResponse(null, { status }),
      ),
    );
    renderPage();
    expect(await screen.findByText('회의록을 찾을 수 없어요.')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '수정' }),
    ).not.toBeInTheDocument();
  },
);

it('다른 팀 회의록이면 액션을 조회하거나 내용을 보여주지 않는다', async () => {
  const actionRequest = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}/meeting-records/19`, () =>
      HttpResponse.json({ ...meetingApiRecord, teamId: 8 }),
    ),
    http.get(`${API_BASE_URL}/meeting-records/19/actions`, () => {
      actionRequest();
      return HttpResponse.json({ contents: [] });
    }),
  );
  renderPage();
  expect(await screen.findByText('회의록을 찾을 수 없어요.')).toBeVisible();
  expect(actionRequest).not.toHaveBeenCalled();
  expect(screen.queryByText('진행 점검 회의')).not.toBeInTheDocument();
});

it('팀이 없으면 상세·작성에서 네트워크 요청 없이 별도 상태를 표시한다', async () => {
  useAuthStore
    .getState()
    .setCurrentUser({ ...demoStudent, currentTeam: null, teamId: null });
  const request = vi.fn();
  server.use(
    http.all('*', () => {
      request();
      return new HttpResponse(null, { status: 500 });
    }),
  );
  renderPage(
    <>
      <MeetingDetailPage meetingId='19' />
      <MeetingNewPage />
    </>,
  );
  expect(screen.getAllByText('소속 팀이 없어요.')).toHaveLength(2);
  await act(async () => {});
  expect(request).not.toHaveBeenCalled();
});
