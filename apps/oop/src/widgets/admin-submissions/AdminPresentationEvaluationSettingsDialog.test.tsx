import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useMemo, type ComponentProps } from 'react';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAdminPresentationEvaluationsQuery } from '~/features/admin-milestone-review/queries';
import { adminPresentationEvaluationKeys } from '~/features/admin-milestone-review/queries/adminPresentationEvaluationKeys';
import { adminTeamEvaluationCriteriaKeys } from '~/features/admin-milestone-review/queries/adminTeamEvaluationCriteriaKeys';

import { AdminPresentationEvaluationSettingsDialog } from './AdminPresentationEvaluationSettingsDialog';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  vi.useRealTimers();
  server.resetHandlers();
  clients.splice(0).forEach(client => client.clear());
  setApiAccessToken(null);
});
afterAll(() => server.close());
const teams = [
  { teamId: 7, teamName: '7팀', presentationOrder: 2 },
  { teamId: 9, teamName: '9팀', presentationOrder: 1 },
];
type DialogProps = ComponentProps<
  typeof AdminPresentationEvaluationSettingsDialog
>;

function QueryBackedDialog(props: DialogProps) {
  const query = useAdminPresentationEvaluationsQuery(props.sectionId);
  const orderTeams = useMemo(
    () =>
      query.data?.teams.map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        presentationOrder: team.presentationOrder,
      })) ?? [],
    [query.data?.teams],
  );
  if (!query.data) return null;
  return (
    <AdminPresentationEvaluationSettingsDialog {...props} teams={orderTeams} />
  );
}

function setup(
  input: DialogProps['teams'] = teams,
  Dialog = AdminPresentationEvaluationSettingsDialog,
) {
  setApiAccessToken('test-token');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const close = vi.fn();
  const view = (props: Partial<DialogProps> = {}) => (
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <Dialog
          evaluationStartsAt={null}
          isOpen
          onClose={close}
          sectionId='1'
          milestoneId='10'
          teams={input}
          {...props}
        />
      </QueryClientProvider>
    </AstryxThemeProvider>
  );
  const { rerender } = render(view());
  return {
    client,
    close,
    rerender: (props: Partial<DialogProps>) => rerender(view(props)),
  };
}
it('blocks creation while criteria load or fail, then uses the highest loaded display order after retry', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  let failed = true;
  const bodies: unknown[] = [];
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      async () => {
        await gate;
        return failed
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json({
              contents: [
                { id: 1, title: '기존', maxScore: 3, displayOrder: 8 },
                { id: 2, title: '처음', maxScore: 2, displayOrder: 0 },
              ],
            });
      },
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ id: 3 });
      },
    ),
  );
  const { client } = setup();
  const user = userEvent.setup();
  await user.type(
    screen.getByRole('textbox', { name: /평가 항목명/ }),
    '새 항목',
  );
  await user.type(screen.getByRole('spinbutton', { name: '배점' }), '5');
  const add = screen.getByRole('button', { name: '평가 항목 추가' });
  expect(add).toBeDisabled();
  await user.click(add);
  expect(bodies).toEqual([]);
  await act(async () => release());
  await screen.findByText('평가 항목을 불러오지 못했습니다.');
  expect(add).toBeDisabled();
  await user.click(add);
  expect(bodies).toEqual([]);
  // A failed background refetch with stale criteria must remain blocked too.
  act(() =>
    client.setQueryData(adminTeamEvaluationCriteriaKeys.list('1'), {
      contents: [],
    }),
  );
  await act(async () => {
    await client.refetchQueries({
      queryKey: adminTeamEvaluationCriteriaKeys.list('1'),
    });
  });
  expect(add).toBeDisabled();
  failed = false;
  await user.click(screen.getByRole('button', { name: '다시 시도' }));
  await waitFor(() => expect(add).toBeEnabled());
  await user.click(add);
  await waitFor(() =>
    expect(bodies).toEqual([
      { title: '새 항목', maxScore: 5, displayOrder: 9 },
    ]),
  );
});
it('submits exactly the displayed explicit order array', async () => {
  const bodies: unknown[] = [];
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () => HttpResponse.json({ contents: [] }),
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.PRESENTATION_ORDER('10')}`,
      async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  const { close } = setup();
  await userEvent.click(screen.getByRole('button', { name: '발표 순서 저장' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(bodies).toEqual([
    {
      teamOrders: [
        { teamId: 7, order: 2 },
        { teamId: 9, order: 1 },
      ],
    },
  ]);
});

it('shows an empty-team message and prevents an empty presentation-order request', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () => HttpResponse.json({ contents: [] }),
    ),
  );

  setup([]);

  expect(
    screen.getByText('발표 순서를 설정할 팀이 없습니다.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '발표 순서 저장' })).toBeDisabled();
});

it('locks presentation orders and criteria after the evaluation period starts', async () => {
  const orderRequests: unknown[] = [];
  const criterionRequests: unknown[] = [];
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () => HttpResponse.json({ contents: [] }),
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.PRESENTATION_ORDER('10')}`,
      async ({ request }) => {
        orderRequests.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      },
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      async ({ request }) => {
        criterionRequests.push(await request.json());
        return HttpResponse.json({ id: 1 });
      },
    ),
  );

  setup(teams, AdminPresentationEvaluationSettingsDialog).rerender({
    evaluationStartsAt: '2020-01-01T00:00:00+09:00',
  });

  await screen.findByText('등록된 평가 항목이 없습니다.');
  expect(
    screen.getByRole('combobox', { name: '7팀 발표 순서' }),
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: '발표 순서 저장' })).toBeDisabled();
  expect(screen.getByRole('textbox', { name: /평가 항목명/ })).toBeDisabled();
  expect(screen.getByRole('spinbutton', { name: '배점' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '평가 항목 추가' })).toBeDisabled();
  expect(orderRequests).toEqual([]);
  expect(criterionRequests).toEqual([]);
});

it('locks presentation order while the settings dialog remains open', () => {
  vi.useFakeTimers();
  vi.setSystemTime('2026-09-22T09:00:00+09:00');
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () => HttpResponse.json({ contents: [] }),
    ),
  );

  setup(teams, AdminPresentationEvaluationSettingsDialog).rerender({
    evaluationStartsAt: '2026-09-22T09:00:01+09:00',
  });
  const order = screen.getByRole('combobox', { name: '7팀 발표 순서' });
  expect(order).toBeEnabled();

  act(() => vi.advanceTimersByTime(1_025));

  expect(order).toBeDisabled();
  expect(screen.getByRole('button', { name: '발표 순서 저장' })).toBeDisabled();
});

it('locks settings immediately when the dialog opens after evaluation starts', () => {
  vi.useFakeTimers();
  vi.setSystemTime('2026-09-22T09:00:00+09:00');
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () => HttpResponse.json({ contents: [] }),
    ),
  );

  const { rerender } = setup(teams, AdminPresentationEvaluationSettingsDialog);
  rerender({
    evaluationStartsAt: '2026-09-22T09:00:01+09:00',
    isOpen: false,
  });

  act(() => vi.advanceTimersByTime(1_025));
  rerender({
    evaluationStartsAt: '2026-09-22T09:00:01+09:00',
    isOpen: true,
  });

  expect(
    screen.getByRole('combobox', { name: '7팀 발표 순서' }),
  ).toBeDisabled();
  expect(screen.getByRole('button', { name: '발표 순서 저장' })).toBeDisabled();
  expect(screen.getByRole('button', { name: '평가 항목 추가' })).toBeDisabled();
});

it('preserves unsaved orders through criterion creation and teams refetch, then submits those explicit orders', async () => {
  const criterion = { id: 1, title: '새 항목', maxScore: 5, displayOrder: 0 };
  let criterionCreated = false;
  const readOrders = vi.fn(() =>
    HttpResponse.json({
      section: { id: '1', label: '분반 1' },
      evaluationPeriod: { startsAt: null, endsAt: null },
      criteria: criterionCreated ? [{ id: '1', label: '새 항목' }] : [],
      teams: teams.map(team => ({
        ...team,
        presentationOrder: null,
        submissionId: null,
        projectTopic: null,
        submittedEvaluatorCount: 0,
        // A refreshed criterion changes teams identity even with Query's structural sharing.
        criteria: criterionCreated ? { '1': null } : {},
      })),
    }),
  );
  const criterionBodies: unknown[] = [];
  const orderBodies: unknown[] = [];
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS('1')}`,
      readOrders,
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () =>
        HttpResponse.json({ contents: criterionCreated ? [criterion] : [] }),
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      async ({ request }) => {
        criterionBodies.push(await request.json());
        criterionCreated = true;
        return HttpResponse.json(criterion);
      },
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.PRESENTATION_ORDER('10')}`,
      async ({ request }) => {
        orderBodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  const { client, close } = setup(teams, QueryBackedDialog);
  const user = userEvent.setup();
  const first = await screen.findByRole('combobox', { name: '7팀 발표 순서' });
  const second = screen.getByRole('combobox', { name: '9팀 발표 순서' });
  await user.click(first);
  await user.click(screen.getByRole('option', { name: '2번' }));
  await user.click(second);
  await user.click(screen.getByRole('option', { name: '1번' }));
  expect(first).toHaveTextContent('2번');
  expect(second).toHaveTextContent('1번');
  const beforeRefetch = client.getQueryData(
    adminPresentationEvaluationKeys.list('1'),
  );
  const title = screen.getByRole('textbox', { name: /평가 항목명/ });
  await user.type(title, '새 항목');
  await user.type(screen.getByRole('spinbutton', { name: '배점' }), '5');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '평가 항목 추가' }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: '평가 항목 추가' }));
  await screen.findByText('1. 새 항목 · 5점');
  // The mutation clears the title only after its invalidated queries finish.
  await waitFor(() => expect(title).toHaveValue(''));
  expect(readOrders).toHaveBeenCalledTimes(2);
  expect(
    client.getQueryData(adminPresentationEvaluationKeys.list('1')),
  ).not.toBe(beforeRefetch);
  expect(criterionBodies).toEqual([
    { title: '새 항목', maxScore: 5, displayOrder: 0 },
  ]);
  expect(first).toHaveTextContent('2번');
  expect(second).toHaveTextContent('1번');
  expect(orderBodies).toEqual([]);
  expect(close).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '발표 순서 저장' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(orderBodies).toEqual([
    {
      teamOrders: [
        { teamId: 7, order: 2 },
        { teamId: 9, order: 1 },
      ],
    },
  ]);
});

it.each([
  { sectionId: '2', milestoneId: '10' },
  { sectionId: '1', milestoneId: '20' },
])(
  'resets unsaved orders when the open context changes to $sectionId/$milestoneId',
  async context => {
    server.use(
      ...['1', '2'].map(sectionId =>
        http.get(
          `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA(sectionId)}`,
          () => HttpResponse.json({ contents: [] }),
        ),
      ),
    );
    const { rerender } = setup();
    const user = userEvent.setup();
    const first = screen.getByRole('combobox', { name: '7팀 발표 순서' });
    await user.click(first);
    await user.click(screen.getByRole('option', { name: '1번' }));
    expect(first).toHaveTextContent('1번');
    // Keep the same teams reference so the context change alone must reset drafts.
    rerender(context);
    expect(first).toHaveTextContent('2번');
    expect(
      screen.getByRole('combobox', { name: '9팀 발표 순서' }),
    ).toHaveTextContent('1번');
  },
);

it('discards unsaved orders on close and initializes from current teams on reopen', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
      () => HttpResponse.json({ contents: [] }),
    ),
  );
  const { close, rerender } = setup();
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: '7팀 발표 순서' }));
  await user.click(screen.getByRole('option', { name: '1번' }));
  await user.click(screen.getByRole('button', { name: '취소' }));
  expect(close).toHaveBeenCalledOnce();
  rerender({ isOpen: false });
  expect(
    screen.queryByRole('dialog', { name: '발표 순서·평가 항목 설정' }),
  ).not.toBeInTheDocument();
  rerender({ isOpen: true });
  expect(
    screen.getByRole('combobox', { name: '7팀 발표 순서' }),
  ).toHaveTextContent('2번');
  await user.click(screen.getByRole('button', { name: '취소' }));
  rerender({ isOpen: false });
  const unassignedTeams = teams.map(team => ({
    ...team,
    presentationOrder: null,
  }));
  rerender({ isOpen: false, teams: unassignedTeams });
  rerender({ isOpen: true, teams: unassignedTeams });
  expect(
    screen.getByRole('combobox', { name: '7팀 발표 순서' }),
  ).not.toHaveTextContent('2번');
  expect(
    screen.getByRole('combobox', { name: '9팀 발표 순서' }),
  ).not.toHaveTextContent('1번');
});
