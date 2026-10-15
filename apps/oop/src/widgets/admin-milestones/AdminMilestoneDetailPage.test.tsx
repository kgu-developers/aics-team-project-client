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
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMilestoneDetailPage from './AdminMilestoneDetailPage';

import {
  issueMockSession,
  mockSessionResponseHeaders,
  resetMockSessionState,
} from '~/mocks/authSession';
import {
  getAdminSectionMilestoneFixture,
  resetAdminSectionMilestonesFixture,
} from '~/mocks/data/adminSectionMilestones';
import {
  demoAdmin,
  demoAdminAccessToken,
  demoUserAccounts,
} from '~/mocks/data/users';
import { adminPresentationEvaluationHandlers } from '~/mocks/handlers/adminPresentationEvaluations';
import { adminRequiredArtifactHandlers } from '~/mocks/handlers/adminRequiredArtifacts';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';

const server = setupServer(
  ...adminSectionMilestoneHandlers,
  ...adminRequiredArtifactHandlers,
  ...adminPresentationEvaluationHandlers,
);
const clients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetAdminSectionMilestonesFixture();
  resetMockSessionState();
  mockSessionResponseHeaders(
    issueMockSession(
      demoUserAccounts.find(
        account => account.accessToken === demoAdminAccessToken,
      )!,
    ),
  );
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  setApiAccessToken(null);
  resetAdminSectionMilestonesFixture();
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage(milestoneId: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: {
      ...demoAdmin,
      sections: [{ ...demoAdmin.sections[0]!, id: '1' }],
    },
  });
  const root = createRootRoute();
  const route = createRoute({
    component: AdminMilestoneDetailPage,
    getParentRoute: () => root,
    path: '/admin/milestones/$milestoneId',
    validateSearch: (search: Record<string, unknown>) => ({
      sectionId: search.sectionId ? String(search.sectionId) : undefined,
    }),
  });
  const listRoute = createRoute({
    component: () => <div>마일스톤 목록 화면</div>,
    getParentRoute: () => root,
    path: '/admin/milestones',
  });
  const router = createRouter({
    history: createMemoryHistory({
      initialEntries: [`/admin/milestones/${milestoneId}?sectionId=1`],
    }),
    routeTree: root.addChildren([listRoute, route]),
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}

describe('AdminMilestoneDetailPage 발표 평가 안내', () => {
  it('상호평가는 필수 산출물 대신 학생 상호평가 문항 미리보기를 보여준다', async () => {
    renderPage('105');

    expect(
      await screen.findByRole('heading', {
        name: '학생 상호평가 문항 · 학생 화면 미리보기',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: '필수 산출물' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/기여도 \(%\)/)).toBeDisabled();
  });

  it('발표 자료의 현재 산출물 설정을 학생 제출 모달 모양으로 함께 보여준다', async () => {
    renderPage('106');

    expect(
      await screen.findByRole('region', {
        name: '발표 자료 제출 학생 제출 모달 미리보기',
      }),
    ).toBeVisible();
    expect(
      await screen.findByRole('button', { name: '프레젠테이션 자료' }),
    ).toBeDisabled();
    expect(await screen.findByLabelText(/시연 영상/)).toBeDisabled();
  });

  it('발표 자료 조회에서도 현재 학생 발표 평가 문항을 보여준다', async () => {
    renderPage('106');

    const questionsHeading = await screen.findByRole('heading', {
      name: '학생 발표 평가 문항',
    });
    const artifactsHeading = await screen.findByRole('heading', {
      name: '필수 산출물',
    });

    expect(questionsHeading).toBeVisible();
    expect(questionsHeading.compareDocumentPosition(artifactsHeading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText('프로젝트 완성도 · 5점')).toBeVisible();
    expect(screen.getByText('기능 구성과 구현 · 5점')).toBeVisible();
  });

  it('발표 평가는 제출물 관리 화면에서 시작하도록 안내한다', async () => {
    renderPage('106');

    expect(
      await screen.findByText(
        /제출물 관리의 발표 평가 탭에서 평가를 시작할 수 있습니다/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '발표 평가 관리로 이동' }),
    ).toBeVisible();
  });
});

describe('AdminMilestoneDetailPage 마일스톤 삭제', () => {
  it('미공개 마일스톤은 확인 후 삭제하고 해당 분반 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    renderPage('102');

    await user.click(await screen.findByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('alertdialog', {
      name: '중간 보고서 마일스톤을 삭제할까요?',
    });
    expect(
      within(dialog).getByText(/운영 데이터가 있으면 삭제되지 않습니다/),
    ).toBeVisible();

    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('마일스톤 목록 화면')).toBeVisible();
    expect(getAdminSectionMilestoneFixture('1', '102')).toBeUndefined();
  });

  it('공개된 마일스톤은 삭제 버튼과 비활성화 사유를 보여준다', async () => {
    renderPage('101');

    expect(
      await screen.findByRole('heading', { name: '제안서 · OOP-01' }),
    ).toBeVisible();
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
    const tooltipId = deleteButton.getAttribute('aria-describedby');
    expect(tooltipId).toBeTruthy();
    expect(document.getElementById(tooltipId!)).toHaveTextContent(
      '마일스톤 목록에서 공개 상태를 미공개로 변경한 뒤 삭제할 수 있습니다.',
    );
  });

  it('운영 데이터 충돌 응답을 받으면 이유를 안내하고 상세 화면을 유지한다', async () => {
    server.use(
      http.delete(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '102')}`,
        () =>
          HttpResponse.json(
            { code: 'MILESTONE_DELETE_CONFLICT' },
            { status: 409 },
          ),
      ),
    );
    const user = userEvent.setup();
    renderPage('102');

    await user.click(await screen.findByRole('button', { name: '삭제' }));
    const dialog = screen.getByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(
      await within(dialog).findByText(
        '미공개 상태가 아니거나 제출·평가 등 운영 데이터가 있어 삭제할 수 없습니다.',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: '중간 보고서 · OOP-01' }),
    ).toBeVisible();

    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true');
    const tooltipId = deleteButton.getAttribute('aria-describedby');
    expect(tooltipId).toBeTruthy();
    expect(document.getElementById(tooltipId!)).toHaveTextContent(
      '미공개 상태가 아니거나 제출·평가 등 운영 데이터가 있어 삭제할 수 없습니다.',
    );
  });
});
