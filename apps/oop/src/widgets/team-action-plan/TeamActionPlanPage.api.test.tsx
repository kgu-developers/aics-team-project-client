import { API_BASE_URL, fetchMeetingActionEntries } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
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
import { meetingApiKeys } from '~/features/meeting/queries/api';

import TeamActionPlanPage from './TeamActionPlanPage';

import { meetingApiTeam } from '~/mocks/data/meetingApi';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { createMeetingApiHandlers } from '~/mocks/handlers/meetingApi';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(
    function (this: HTMLDialogElement) {
      this.open = true;
    },
  );
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.open = false;
  });
});
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
});
afterAll(() => {
  server.close();
  vi.restoreAllMocks();
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <AstryxThemeProvider>
        <ToastViewport>
          <TeamActionPlanPage />
        </ToastViewport>
      </AstryxThemeProvider>
    </QueryClientProvider>,
  );
  return client;
}
async function ready() {
  await screen.findByRole('heading', { name: '팀 액션 플랜' });
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '액션 플랜 추가' }),
    ).toBeEnabled(),
  );
}
async function addDialog(
  user: ReturnType<typeof userEvent.setup>,
  content = '신규 액션 검증',
) {
  await ready();
  await user.click(screen.getByRole('button', { name: '액션 플랜 추가' }));
  const dialog = screen.getByRole('dialog', { name: '액션 플랜 추가' });
  await user.type(
    within(dialog).getByRole('textbox', { name: /액션 항목/ }),
    content,
  );
  return dialog;
}

it('실제 팀 ID와 학번으로 목록·제목 링크·기한·담당자를 표시하고 필터링한다', async () => {
  const user = userEvent.setup();
  renderPage();
  await ready();
  const link = screen.getByRole('link', { name: '회의록 상세 화면 검증' });
  expect(link).toHaveAttribute('href', '/student/meetings/19');
  await user.hover(link);
  expect(
    await screen.findByRole('tooltip', { name: '회의록: 진행 점검 회의' }),
  ).toBeVisible();
  expect(screen.getByText('2026-09-10')).toBeVisible();
  await user.click(screen.getByRole('combobox', { name: '담당자' }));
  await user.click(screen.getByRole('option', { name: 'OOP 데모 학생 A' }));
  expect(
    screen.queryByRole('link', { name: '회의록 상세 화면 검증' }),
  ).not.toBeInTheDocument();
});

it('등록은 학번과 content만 보내고 TODO로 생성한 뒤 목록과 회의별 캐시를 갱신한다', async () => {
  const user = userEvent.setup();
  const bodies: unknown[] = [];
  server.use(
    http.post(
      `${API_BASE_URL}/meeting-records/19/actions`,
      async ({ request }) => {
        bodies.push(await request.clone().json());
        return undefined;
      },
    ),
  );
  const client = renderPage();
  client.setQueryData(meetingApiKeys.recordActions('19'), []);
  client.setQueryData(meetingApiKeys.filteredTeamActions('8'), []);
  const dialog = await addDialog(user, '  새 담당 액션  ');
  await user.click(within(dialog).getByRole('combobox', { name: '담당자' }));
  await user.click(screen.getByRole('option', { name: 'OOP 데모 학생 A' }));
  await user.click(within(dialog).getByRole('button', { name: '추가' }));
  expect(
    await screen.findByRole('link', { name: '새 담당 액션' }),
  ).toBeVisible();
  expect(bodies).toEqual([{ content: '새 담당 액션', assigneeId: '20260001' }]);
  expect(
    screen.queryByRole('dialog', { name: '액션 플랜 추가' }),
  ).not.toBeInTheDocument();
  const actions = await fetchMeetingActionEntries('19');
  expect(
    actions.find(action => action.content === '새 담당 액션'),
  ).toMatchObject({
    status: 'TODO',
    assignee: { userId: '20260001' },
    dueAt: null,
  });
  expect(
    client.getQueryState(meetingApiKeys.recordActions('19'))?.isInvalidated,
  ).toBe(true);
  expect(
    client.getQueryState(meetingApiKeys.filteredTeamActions('8'))
      ?.isInvalidated,
  ).toBe(false);
});

it('내용만 수정하면 기존 담당자와 기한 시각을 덮어쓰지 않는다', async () => {
  const user = userEvent.setup();
  const bodies: unknown[] = [];
  server.use(
    http.patch(`${API_BASE_URL}/meeting-actions/41`, async ({ request }) => {
      bodies.push(await request.clone().json());
      return undefined;
    }),
  );
  renderPage();
  await ready();
  await user.click(
    within(
      screen.getByRole('row', { name: /회의록 상세 화면 검증/ }),
    ).getByRole('button', { name: '수정' }),
  );
  const dialog = screen.getByRole('dialog', { name: '액션 플랜 수정' });
  await user.clear(within(dialog).getByRole('textbox', { name: /액션 항목/ }));
  await user.type(
    within(dialog).getByRole('textbox', { name: /액션 항목/ }),
    '내용만 수정',
  );
  await user.click(within(dialog).getByRole('button', { name: '저장' }));
  expect(
    await screen.findByRole('link', { name: '내용만 수정' }),
  ).toBeVisible();
  expect(bodies).toEqual([{ content: '내용만 수정' }]);
  expect((await fetchMeetingActionEntries('19'))[0]?.dueAt).toBe(
    '2026-09-10 18:00',
  );
});

it('담당자와 기한을 비우면 clear 플래그로 서버와 화면에 반영한다', async () => {
  const user = userEvent.setup();
  const bodies: unknown[] = [];
  server.use(
    http.patch(`${API_BASE_URL}/meeting-actions/41`, async ({ request }) => {
      bodies.push(await request.clone().json());
      return undefined;
    }),
  );
  renderPage();
  await ready();
  await user.click(
    within(
      screen.getByRole('row', { name: /회의록 상세 화면 검증/ }),
    ).getByRole('button', { name: '수정' }),
  );
  const dialog = screen.getByRole('dialog', { name: '액션 플랜 수정' });
  await user.click(within(dialog).getByRole('combobox', { name: '담당자' }));
  await user.click(screen.getByRole('option', { name: '미정' }));
  await user.click(within(dialog).getByRole('button', { name: 'Clear 기한' }));
  await user.click(within(dialog).getByRole('button', { name: '저장' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: '액션 플랜 수정' }),
    ).not.toBeInTheDocument(),
  );
  expect(bodies).toEqual([
    { content: '회의록 상세 화면 검증', clearAssignee: true, clearDueAt: true },
  ]);
  expect((await fetchMeetingActionEntries('19'))[0]).toMatchObject({
    assignee: null,
    dueAt: null,
  });
});

it('상태를 PATCH로 변경하고 필터된 목록에서 제거한다', async () => {
  const user = userEvent.setup();
  renderPage();
  await ready();
  await user.click(screen.getByRole('combobox', { name: '상태' }));
  await user.click(screen.getByRole('option', { name: '시작 전' }));
  await user.click(
    screen.getByRole('combobox', { name: '회의록 상세 화면 검증 상태' }),
  );
  await user.click(screen.getByRole('option', { name: /완료$/ }));
  await waitFor(() =>
    expect(
      screen.queryByRole('link', { name: '회의록 상세 화면 검증' }),
    ).not.toBeInTheDocument(),
  );
  expect((await fetchMeetingActionEntries('19'))[0]?.status).toBe('DONE');
});

it.each([null, 'invalid'])(
  '팀 ID %s에서는 네트워크 요청 없이 미배정 또는 오류를 안내한다',
  async teamId => {
    const requests = vi.fn();
    server.events.on('request:start', requests);
    useAuthStore
      .getState()
      .setCurrentUser({ ...demoStudent, teamId, currentTeam: null });
    renderPage();
    expect(
      await screen.findByText(
        teamId ? '다시 시도해 주세요.' : '소속 팀이 없어요.',
      ),
    ).toBeVisible();
    expect(requests).not.toHaveBeenCalled();
  },
);

it('팀원 조회 403을 미배정으로 숨기지 않고 재시도로 복구한다', async () => {
  const user = userEvent.setup();
  server.use(
    http.get(
      `${API_BASE_URL}/api/v1/oop/teams/7/kickoff`,
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  renderPage();
  expect(
    await screen.findByText('팀 액션 플랜 또는 팀원 정보를 불러오지 못했어요.'),
  ).toBeVisible();
  server.use(
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () =>
      HttpResponse.json(meetingApiTeam),
    ),
  );
  await user.click(screen.getByRole('button', { name: '다시 시도' }));
  await ready();
});

it('회의록 목록 오류가 나도 액션 목록을 유지하고 추가만 차단한다', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}/teams/7/meeting-records`,
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  renderPage();
  expect(
    await screen.findByRole('link', { name: '회의록 상세 화면 검증' }),
  ).toBeVisible();
  expect(
    await screen.findByText(
      '회의록 목록을 불러오지 못해 액션 플랜을 추가할 수 없어요.',
    ),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '액션 플랜 추가' })).toBeDisabled();
});

it('등록 409 오류는 토스트로 표시하고 입력 유지 및 자동 재시도 방지를 유지한다', async () => {
  const user = userEvent.setup();
  const writes = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/meeting-records/19/actions`, () => {
      writes();
      return HttpResponse.json({ code: 'DATA_CONFLICT' }, { status: 409 });
    }),
  );
  renderPage();
  const dialog = await addDialog(user, '보존할 초안');
  await user.click(within(dialog).getByRole('button', { name: '추가' }));
  const message = await screen.findByText(
    /서버 데이터 충돌로 액션 플랜을 저장하지 못했어요/,
  );
  expect(message.closest('[role="alert"]')).not.toBeNull();
  expect(dialog).not.toContainElement(message);
  expect(
    within(dialog).getByRole('textbox', { name: /액션 항목/ }),
  ).toHaveValue('보존할 초안');
  expect(within(dialog).getByRole('button', { name: '추가' })).toBeEnabled();
  expect(
    screen.queryByRole('link', { name: '보존할 초안' }),
  ).not.toBeInTheDocument();
  expect(writes).toHaveBeenCalledOnce();
});

it('등록 응답 5xx에서 중복 등록을 차단하고 목록 확인 후 해제한다', async () => {
  const user = userEvent.setup();
  const writes = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/meeting-records/19/actions`, () => {
      writes();
      return new HttpResponse(null, { status: 503 });
    }),
  );
  renderPage();
  const dialog = await addDialog(user);
  await user.click(within(dialog).getByRole('button', { name: '추가' }));
  const message = await screen.findByText(
    '저장 결과를 확인할 수 없어요. 목록을 새로고침해 등록 여부를 확인해 주세요.',
  );
  expect(message.closest('[role="alert"]')).not.toBeNull();
  expect(dialog).not.toContainElement(message);
  expect(within(dialog).getByRole('button', { name: '추가' })).toBeDisabled();
  await user.click(within(dialog).getByRole('button', { name: '취소' }));
  expect(screen.getByRole('button', { name: '액션 플랜 추가' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '등록 내역 확인' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '액션 플랜 추가' }),
    ).toBeEnabled(),
  );
  expect(writes).toHaveBeenCalledOnce();
});

it('팀 변경 시 열린 입력과 이전 팀 액션을 제거한다', async () => {
  const user = userEvent.setup();
  renderPage();
  await addDialog(user, '이전 팀 초안');
  await act(async () => {
    useAuthStore
      .getState()
      .setCurrentUser({ ...demoStudent, teamId: null, currentTeam: null });
  });
  expect(screen.getByText('소속 팀이 없어요.')).toBeVisible();
  expect(
    screen.queryByRole('dialog', { name: '액션 플랜 추가' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: '회의록 상세 화면 검증' }),
  ).not.toBeInTheDocument();
});

it.each(['edit', 'status'] as const)(
  '%s 실패도 오류 토스트로 표시하고 기존 액션을 유지한다',
  async mode => {
    const user = userEvent.setup();
    server.use(
      http.patch(`${API_BASE_URL}/meeting-actions/41`, () =>
        HttpResponse.json({ code: 'DATA_CONFLICT' }, { status: 409 }),
      ),
    );
    renderPage();
    await ready();
    if (mode === 'edit') {
      await user.click(
        within(
          screen.getByRole('row', { name: /회의록 상세 화면 검증/ }),
        ).getByRole('button', { name: '수정' }),
      );
      const dialog = screen.getByRole('dialog', { name: '액션 플랜 수정' });
      const input = within(dialog).getByRole('textbox', { name: /액션 항목/ });
      await user.clear(input);
      await user.type(input, '유지할 수정 내용');
      await user.click(within(dialog).getByRole('button', { name: '저장' }));
      await screen.findByText(
        /서버 데이터 충돌로 액션 플랜을 저장하지 못했어요/,
      );
      expect(input).toHaveValue('유지할 수정 내용');
      expect(
        within(dialog).queryByText(/서버 데이터 충돌/),
      ).not.toBeInTheDocument();
    } else {
      await user.click(
        screen.getByRole('combobox', { name: '회의록 상세 화면 검증 상태' }),
      );
      await user.click(screen.getByRole('option', { name: /완료$/ }));
    }
    const message = await screen.findByText(
      /서버 데이터 충돌로 액션 플랜을 저장하지 못했어요/,
    );
    expect(message.closest('[role="alert"]')).not.toBeNull();
    expect((await fetchMeetingActionEntries('19'))[0]).toMatchObject({
      content: '회의록 상세 화면 검증',
      status: 'TODO',
    });
  },
);

it('독립 액션 목록에서도 개별 삭제 후 회의록은 유지된다', async () => {
  const user = userEvent.setup();
  renderPage();
  await ready();
  const row = screen.getByRole('row', { name: /회의록 상세 화면 검증/ });
  await user.click(within(row).getByRole('button', { name: '삭제' }));
  const dialog = screen.getByRole('dialog', { name: '액션 플랜 삭제' });
  await user.click(within(dialog).getByRole('button', { name: '삭제' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('link', { name: '회의록 상세 화면 검증' }),
    ).not.toBeInTheDocument(),
  );
  expect(await fetchMeetingActionEntries('19')).toEqual([]);
  expect(screen.getByRole('button', { name: '액션 플랜 추가' })).toBeEnabled();
});
