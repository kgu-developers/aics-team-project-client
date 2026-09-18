import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
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
) {
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

it('blocks peer-evaluation editing before hidden schedule validation or any write', async () => {
  const writes = trackWrites();
  const milestone = getAdminSectionMilestoneFixture('1', '101')!;
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
      () =>
        HttpResponse.json({
          ...milestone,
          type: 'PEER_EVALUATION',
          schedule: {
            ...milestone.schedule,
            dueAt: '2026-10-15T23:59:00',
            evaluationOpensAt: '2026-10-20T09:00:00',
            evaluationClosesAt: '2026-10-19T09:00:00',
          },
        }),
    ),
  );
  renderPage(true);
  await screen.findByText('상호 평가 마일스톤은 수정할 수 없습니다.');
  expect(
    screen.getByText(/상호 평가 기간을 변경하는 기능이 지원되지 않아/),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: '저장' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: '제목' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByLabelText('OOP-01 상호 평가 시작일'),
  ).not.toBeInTheDocument();
  const user = userEvent.setup();
  await user.click(screen.getByRole('link', { name: '마일스톤 목록으로' }));
  await waitFor(() =>
    expect(screen.getByText('마일스톤 목록')).toBeInTheDocument(),
  );
  expect(writes).toEqual([]);
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
