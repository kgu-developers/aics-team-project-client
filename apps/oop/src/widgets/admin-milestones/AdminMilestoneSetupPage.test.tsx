import {
  API_BASE_URL,
  ENDPOINTS,
  setApiAccessToken,
  type AdminSectionMilestoneDto,
} from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import {
  fireEvent,
  render,
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
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMilestoneSetupPage from './AdminMilestoneSetupPage';

import { getAdminSectionMilestoneFixture } from '~/mocks/data/adminSectionMilestones';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminPresentationEvaluationHandlers } from '~/mocks/handlers/adminPresentationEvaluations';
import { adminRequiredArtifactHandlers } from '~/mocks/handlers/adminRequiredArtifacts';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

// Keep the real forms and portaled artifact dialogs; simplify only date entry.
vi.mock('@aics/design-system', async importOriginal => ({
  ...(await importOriginal<typeof import('@aics/design-system')>()),
  DateInput: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string;
    onChange: (value: string) => void;
  }) => (
    <input
      aria-label={label}
      type='date'
      value={value ?? ''}
      onChange={event => onChange(event.target.value)}
    />
  ),
}));

const server = setupServer(
  ...adminSectionMilestoneHandlers,
  ...adminRequiredArtifactHandlers,
  ...adminPresentationEvaluationHandlers,
);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  vi.restoreAllMocks();
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  server.events.removeAllListeners();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage(
  editing: boolean,
  sections = [{ ...demoAdmin.sections[0]!, id: '1' }],
  creationMilestonesBySection: Record<string, AdminSectionMilestoneDto[]> = {},
) {
  if (!editing) {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES(':sectionId')}`,
        ({ params }) =>
          HttpResponse.json({
            content:
              creationMilestonesBySection[String(params.sectionId)] ?? [],
          }),
      ),
    );
  }
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: {
      ...demoAdmin,
      sections,
    },
  });
  const root = createRootRoute();
  const route = createRoute({
    getParentRoute: () => root,
    path: '/admin/milestones/new',
    validateSearch: (search: Record<string, unknown>) => ({
      sectionId: String(search.sectionId),
      milestoneId: search.milestoneId ? String(search.milestoneId) : undefined,
    }),
    component: AdminMilestoneSetupPage,
  });
  const listRoute = createRoute({
    getParentRoute: () => root,
    path: '/admin/milestones',
    component: () => <div>마일스톤 목록</div>,
  });
  const router = createRouter({
    routeTree: root.addChildren([route, listRoute]),
    history: createMemoryHistory({
      initialEntries: [
        `/admin/milestones/new?sectionId=1${editing ? '&milestoneId=101' : ''}`,
      ],
    }),
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );

  return router;
}

function trackWrites() {
  const writes: string[] = [];
  server.events.on('request:start', ({ request }) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method))
      writes.push(`${request.method} ${new URL(request.url).pathname}`);
  });
  return writes;
}

function milestoneWrites(writes: string[]) {
  return writes.filter(write => !write.includes('required-artifacts'));
}

describe('artifact submission isolation', () => {
  it.each(['click', 'Enter'])(
    'draft dialog %s submission keeps forms separate, supports quick time selection, and returns to the list after Save',
    async submission => {
      const consoleError = vi.spyOn(console, 'error');
      const user = userEvent.setup();
      const writes = trackWrites();
      renderPage(false);
      fireEvent.change(await screen.findByLabelText('OOP-01 제출 마감일'), {
        target: { value: '2026-10-15' },
      });
      await user.click(
        screen.getByRole('button', {
          name: 'OOP-01 제출 마감 시간 23:59로 설정',
        }),
      );
      await user.click(screen.getByRole('button', { name: '산출물 추가' }));
      const dialog = await screen.findByRole('dialog', {
        name: '산출물 초안 추가',
      });
      expect(document.querySelector('form form')).toBeNull();
      expect(dialog.closest('form')).toBeNull();
      await user.type(
        within(dialog).getByRole('textbox', { name: /산출물 이름/ }),
        '검증 산출물',
      );
      if (submission === 'Enter') await user.keyboard('{Enter}');
      else
        await user.click(within(dialog).getByRole('button', { name: '추가' }));
      await screen.findByText('검증 산출물');
      expect(writes).toEqual([]);
      const draft =
        screen.getByText('검증 산출물').parentElement!.parentElement!;
      await user.click(within(draft).getByRole('button', { name: '수정' }));
      expect(document.querySelector('form form')).toBeNull();
      await user.click(
        within(
          await screen.findByRole('dialog', { name: '산출물 초안 수정' }),
        ).getByRole('button', { name: '저장' }),
      );
      expect(writes).toEqual([]);
      if (submission === 'Enter') {
        await user.click(screen.getByRole('textbox', { name: '제목' }));
        await user.keyboard('{Enter}');
      } else await user.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => expect(milestoneWrites(writes)).toHaveLength(1));
      expect(milestoneWrites(writes)[0]).toMatch(/^POST /);
      await screen.findByText('마일스톤 목록');
      expect(consoleError).not.toHaveBeenCalled();
    },
  );

  it.each(['click', 'Enter'])(
    'existing artifact dialog %s submission keeps forms separate and explicit milestone Save still works',
    async submission => {
      const consoleError = vi.spyOn(console, 'error');
      const user = userEvent.setup();
      const writes = trackWrites();
      server.use(
        http.put(
          `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
          () => new HttpResponse(null, { status: 204 }),
        ),
      );
      renderPage(true);
      const section = await screen.findByRole('region', {
        name: '필수 산출물 관리',
      });
      await waitFor(() =>
        expect(
          within(section).getAllByRole('button', { name: '수정' }).length,
        ).toBeGreaterThan(0),
      );
      expect(document.querySelector('form form')).toBeNull();
      await user.click(
        within(section).getAllByRole('button', { name: '수정' })[0]!,
      );
      const dialog = await screen.findByRole('dialog', {
        name: '필수 산출물 수정',
      });
      expect(document.querySelector('form form')).toBeNull();
      expect(dialog.closest('form')).toBeNull();
      if (submission === 'Enter') {
        await user.click(
          within(dialog).getByRole('textbox', { name: /산출물 이름/ }),
        );
        await user.keyboard('{Enter}');
      } else
        await user.click(within(dialog).getByRole('button', { name: '저장' }));
      await waitFor(() => expect(writes).toHaveLength(1));
      await waitFor(() =>
        expect(
          screen.queryByRole('dialog', { name: '필수 산출물 수정' }),
        ).not.toBeInTheDocument(),
      );
      expect(writes[0]).toMatch(/^PUT .*required-artifacts/);
      expect(milestoneWrites(writes)).toEqual([]);
      if (submission === 'Enter') {
        await user.click(screen.getByRole('textbox', { name: '제목' }));
        await user.keyboard('{Enter}');
      } else await user.click(screen.getByRole('button', { name: '저장' }));
      await waitFor(() => expect(milestoneWrites(writes)).toHaveLength(1));
      expect(consoleError).not.toHaveBeenCalled();
    },
  );
});

it('shows the fixed peer-evaluation questions and does not offer required artifacts', async () => {
  const user = userEvent.setup();
  renderPage(false);

  await user.click(
    await screen.findByRole('combobox', { name: '마일스톤 기본 양식' }),
  );
  await user.click(screen.getByRole('option', { name: '상호 평가' }));

  const guide = await screen.findByRole('region', {
    name: '학생 상호평가 문항',
  });
  expect(within(guide).getByText('자신의 역할 요약')).toBeVisible();
  expect(within(guide).getByText('팀 프로젝트 평가')).toBeVisible();
  expect(within(guide).getByText('기여도 (%)')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: '산출물 추가' }),
  ).not.toBeInTheDocument();
});

it('blocks creation when the selected section already has the same milestone type', async () => {
  const writes = trackWrites();
  const proposal = getAdminSectionMilestoneFixture('1', '101')!;
  renderPage(false, [{ ...demoAdmin.sections[0]!, id: '1' }], {
    '1': [proposal],
  });

  expect(
    await screen.findByText(
      /같은 유형의 마일스톤이 이미 있습니다.*OOP-01 · OOP-01 — 제안서/,
    ),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  expect(writes).toEqual([]);

  const user = userEvent.setup();
  await user.click(
    screen.getByRole('combobox', { name: '마일스톤 기본 양식' }),
  );
  await user.click(screen.getByRole('option', { name: '중간 점검' }));
  await waitFor(() =>
    expect(
      screen.queryByText(/같은 유형의 마일스톤이 이미 있습니다/),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
});

it('shows each section presentation criteria from the server in milestone setup', async () => {
  const user = userEvent.setup();
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () =>
        HttpResponse.json({
          contents: [
            {
              displayOrder: 0,
              id: 1,
              maxScore: 5,
              title: '프로젝트 완성도',
            },
            {
              displayOrder: 1,
              id: 2,
              maxScore: 5,
              title: '기능 구성과 구현',
            },
          ],
        }),
    ),
  );
  renderPage(false);

  await user.click(
    await screen.findByRole('combobox', { name: '마일스톤 기본 양식' }),
  );
  await user.click(
    screen.getByRole('option', { name: '발표 (자료 제출 + 평가)' }),
  );

  const guide = await screen.findByRole('region', {
    name: '학생 발표 평가 문항',
  });
  expect(
    within(guide).getByText(
      /발표 평가 문항은 분반별 제출물의 발표 평가에서 설정할 수 있습니다/,
    ),
  ).toBeVisible();
  expect(
    await within(guide).findByText('1. 프로젝트 완성도 · 5점'),
  ).toBeVisible();
  expect(within(guide).getByText('2. 기능 구성과 구현 · 5점')).toBeVisible();
});

it('does not offer required artifact management when editing a peer evaluation', async () => {
  const milestone = getAdminSectionMilestoneFixture('1', '101')!;
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      () =>
        HttpResponse.json({
          ...milestone,
          peerEvaluationForm: {
            anonymous: true,
            closesAt: '2026-10-20T23:59:00',
            id: 501,
            milestoneId: 101,
            opensAt: '2026-10-16T09:00:00',
            sectionId: 1,
          },
          schedule: {
            ...milestone.schedule,
            dueAt: '2026-10-20T23:59:00',
            evaluationClosesAt: '2026-10-20T23:59:00',
            evaluationOpensAt: '2026-10-16T09:00:00',
          },
          type: 'PEER_EVALUATION',
        }),
    ),
  );
  renderPage(true);

  await screen.findByRole('region', { name: '학생 상호평가 문항' });
  expect(
    screen.queryByRole('region', { name: '필수 산출물 관리' }),
  ).not.toBeInTheDocument();
});

it('부분 생성 실패를 재시도해도 이미 생성한 분반의 마일스톤을 다시 만들지 않는다', async () => {
  const attempts: string[] = [];
  server.use(
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES(':sectionId')}`,
      ({ params }) => {
        const sectionId = String(params.sectionId);
        attempts.push(sectionId);
        if (sectionId === '2' && attempts.filter(id => id === '2').length === 1)
          return new HttpResponse(null, { status: 500 });

        return HttpResponse.json(
          { id: sectionId === '1' ? 901 : 902 },
          { status: 201 },
        );
      },
    ),
  );
  renderPage(false, [
    { ...demoAdmin.sections[0]!, id: '1' },
    { ...demoAdmin.sections[0]!, code: 'OOP-02', id: '2', name: 'OOP-02' },
  ]);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('combobox', { name: '대상 분반' }));
  await user.click(screen.getByRole('option', { name: /OOP-02/ }));
  fireEvent.change(screen.getByLabelText('OOP-01 제출 마감일'), {
    target: { value: '2026-10-15' },
  });
  fireEvent.change(screen.getByLabelText('OOP-01 제출 마감 시간'), {
    target: { value: '23:59' },
  });
  fireEvent.change(screen.getByLabelText('OOP-02 제출 마감일'), {
    target: { value: '2026-10-15' },
  });
  fireEvent.change(screen.getByLabelText('OOP-02 제출 마감 시간'), {
    target: { value: '23:59' },
  });
  await user.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(attempts).toEqual(['1', '2']));
  await user.click(
    screen.getByRole('button', { name: '실패한 작업 다시 시도' }),
  );
  await waitFor(() => expect(attempts).toEqual(['1', '2', '2']));
  await screen.findByText('마일스톤 목록');
});

it('생성 실패 시 서버 응답 상태와 코드를 원인과 함께 보여준다', async () => {
  server.use(
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES(':sectionId')}`,
      () =>
        HttpResponse.json({ code: 'MILESTONE_WEEK_CONFLICT' }, { status: 409 }),
    ),
  );
  renderPage(false);
  const user = userEvent.setup();
  fireEvent.change(await screen.findByLabelText('OOP-01 제출 마감일'), {
    target: { value: '2026-10-15' },
  });
  fireEvent.change(screen.getByLabelText('OOP-01 제출 마감 시간'), {
    target: { value: '23:59' },
  });
  await user.click(screen.getByRole('button', { name: '저장' }));

  const result = await screen.findByText(/생성에 실패했습니다\./);
  expect(result).toHaveTextContent(
    '같은 분반에서 해당 주차를 이미 사용 중입니다. 다른 주차를 입력해주세요. (HTTP 409 · MILESTONE_WEEK_CONFLICT)',
  );
  expect(screen.queryByText('마일스톤 목록')).not.toBeInTheDocument();
});

it('edits peer evaluation while preserving the hidden anonymous setting', async () => {
  const bodies: unknown[] = [];
  const milestone = getAdminSectionMilestoneFixture('1', '101')!;
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      () =>
        HttpResponse.json({
          ...milestone,
          type: 'PEER_EVALUATION',
          peerEvaluationForm: {
            anonymous: true,
            closesAt: '2026-10-20T23:59:00',
            id: 501,
            milestoneId: 101,
            opensAt: '2026-10-16T09:00:00',
            sectionId: 1,
          },
          schedule: {
            ...milestone.schedule,
            dueAt: '2026-10-20T23:59:00',
            evaluationOpensAt: '2026-10-16T09:00:00',
            evaluationClosesAt: '2026-10-20T23:59:00',
          },
        }),
    ),
    http.put(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  renderPage(true);
  const user = userEvent.setup();
  const starts = await screen.findByLabelText('OOP-01 상호 평가 시작일');
  expect(starts).toHaveValue('2026-10-16');
  expect(screen.queryByLabelText('OOP-01 공개 시작일')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('combobox', { name: 'OOP-01 상호 평가 익명 여부' }),
  ).not.toBeInTheDocument();
  fireEvent.change(starts, { target: { value: '2026-10-17' } });
  await user.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(bodies).toHaveLength(1));
  expect(bodies[0]).toMatchObject({
    anonymous: true,
    type: 'PEER_EVALUATION',
    schedule: {
      dueAt: '2026-10-20T23:59:00',
      evaluationClosesAt: '2026-10-20T23:59:00',
      evaluationOpensAt: '2026-10-17T09:00:00',
    },
  });
});

it('does not enter peer-evaluation editing when the linked form is missing', async () => {
  const writes = trackWrites();
  const milestone = getAdminSectionMilestoneFixture('1', '101')!;
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      () =>
        HttpResponse.json({
          ...milestone,
          peerEvaluationForm: null,
          type: 'PEER_EVALUATION',
        }),
    ),
  );
  renderPage(true);
  await screen.findByText('연결된 상호 평가 양식이 없습니다.');
  expect(
    screen.queryByRole('button', { name: '저장' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: '제목' }),
  ).not.toBeInTheDocument();
  expect(writes).toEqual([]);
});

it('keeps the peer-evaluation form values when its update fails', async () => {
  const milestone = getAdminSectionMilestoneFixture('1', '101')!;
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      () =>
        HttpResponse.json({
          ...milestone,
          peerEvaluationForm: {
            anonymous: true,
            closesAt: '2026-10-20T23:59:00',
            id: 501,
            milestoneId: 101,
            opensAt: '2026-10-16T09:00:00',
            sectionId: 1,
          },
          type: 'PEER_EVALUATION',
        }),
    ),
    http.put(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      () =>
        HttpResponse.json(
          { code: 'INVALID_MILESTONE_REQUEST' },
          { status: 400 },
        ),
    ),
  );
  renderPage(true);
  const user = userEvent.setup();
  const title = await screen.findByRole('textbox', { name: '제목' });
  await user.clear(title);
  await user.type(title, '수정 중인 상호 평가');
  await user.click(screen.getByRole('button', { name: '저장' }));
  expect(
    await screen.findByText(/마일스톤을 수정하지 못했습니다\./),
  ).toBeVisible();
  expect(title).toHaveValue('수정 중인 상호 평가');
});

it('creates peer evaluation with a separate form window and no presentation window on the milestone', async () => {
  const milestoneBodies: unknown[] = [];
  const formBodies: unknown[] = [];
  server.use(
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES('1')}`,
      async ({ request }) => {
        milestoneBodies.push(await request.json());
        return HttpResponse.json({ id: 901 }, { status: 201 });
      },
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_FORM('1')}`,
      async ({ request }) => {
        formBodies.push(await request.json());
        return HttpResponse.json({ id: 902 }, { status: 201 });
      },
    ),
  );
  renderPage(false);
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('combobox', { name: '마일스톤 기본 양식' }),
  );
  await user.click(screen.getByRole('option', { name: '상호 평가' }));
  for (const [label, value] of [
    ['OOP-01 상호 평가 시작일', '2026-10-16'],
    ['OOP-01 평가 시작 시간', '09:00'],
    ['OOP-01 상호 평가 종료일', '2026-10-20'],
    ['OOP-01 평가 종료 시간', '23:59'],
  ]) {
    fireEvent.change(screen.getByLabelText(label!), { target: { value } });
  }
  await user.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(formBodies).toHaveLength(1));
  expect(milestoneBodies).toEqual([
    expect.objectContaining({
      type: 'PEER_EVALUATION',
      schedule: { dueAt: '2026-10-20T23:59:00' },
    }),
  ]);
  expect(formBodies).toEqual([
    {
      anonymous: true,
      milestoneId: 901,
      opensAt: '2026-10-16T09:00:00',
      closesAt: '2026-10-20T23:59:00',
    },
  ]);
});

it('still edits a presentation milestone and persists its visible evaluation window', async () => {
  const milestone = getAdminSectionMilestoneFixture('1', '101')!;
  const bodies: unknown[] = [];
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      () =>
        HttpResponse.json({
          ...milestone,
          type: 'PRESENTATION',
          schedule: {
            opensAt: '2026-10-01T09:00:00',
            dueAt: '2026-10-15T23:59:00',
            evaluationOpensAt: '2026-10-16T09:00:00',
            evaluationClosesAt: '2026-10-20T23:59:00',
          },
        }),
    ),
    http.put(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  renderPage(true);
  const starts = await screen.findByLabelText('OOP-01 발표 평가 시작일');
  await waitFor(() => expect(starts).toHaveValue('2026-10-16'));
  fireEvent.change(starts, { target: { value: '2026-10-17' } });
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() => expect(bodies).toHaveLength(1));
  expect(bodies[0]).toMatchObject({
    type: 'PRESENTATION',
    schedule: {
      evaluationOpensAt: '2026-10-17T09:00:00',
      evaluationClosesAt: '2026-10-20T23:59:00',
    },
  });
});
