import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminMeetingDetailPage from './AdminMeetingDetailPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMeetingHandlers } from '~/mocks/handlers/adminMeetings';
import { adminStudentTeamHandlers } from '~/mocks/handlers/adminStudentTeams';

const server = setupServer(
  ...adminMeetingHandlers,
  ...adminStudentTeamHandlers,
);
const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });

  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.open = false;
    },
  });
});
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => {
  server.close();

  if (originalDialogShowModalDescriptor) {
    Object.defineProperty(
      HTMLDialogElement.prototype,
      'showModal',
      originalDialogShowModalDescriptor,
    );
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  }

  if (originalDialogCloseDescriptor) {
    Object.defineProperty(
      HTMLDialogElement.prototype,
      'close',
      originalDialogCloseDescriptor,
    );
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  const rootRoute = createRootRoute();
  const meetingDetailRoute = createRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminMeetingDetailPage />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
    getParentRoute: () => rootRoute,
    path: '/admin/meetings/$meetingId',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/admin/meetings/1'] }),
    routeTree: rootRoute.addChildren([meetingDetailRoute]),
  });

  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: demoAdmin,
  });

  return render(<RouterProvider router={router} />);
}

describe('AdminMeetingDetailPage', () => {
  it('참석자 상세 모달에 분반 수강생 API의 전공을 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: /김민준|20231234/ }),
    );

    expect(await screen.findByText('컴퓨터공학과')).toBeInTheDocument();
  });
});

it('marks only the opened response section and authenticated admin as read, and formats an ISO rollover in Seoul', async () => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD_DETAIL('1')}`,
      () =>
        HttpResponse.json({
          id: 1,
          sectionId: 1,
          sectionName: 'OOP-01',
          teamId: 1,
          teamName: '1팀',
          title: '시간 확인',
          content: '',
          participantIds: [],
          authorId: '20260001',
          meetingAt: '2026-09-01T23:30:00Z',
        }),
    ),
  );
  renderPage();
  await screen.findByText('2026.09.02 08:30');
  await waitFor(() =>
    expect(
      localStorage.getItem(`aics:admin:read:${demoAdmin.id}:1:meetings`),
    ).toBe('["1"]'),
  );
  expect(
    localStorage.getItem(`aics:admin:read:${demoAdmin.id}:2:meetings`),
  ).toBeNull();
  expect(
    localStorage.getItem('aics:admin:read:another-admin:1:meetings'),
  ).toBeNull();
});
it('does not mark a failed meeting detail read', async () => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD_DETAIL('1')}`,
      () => HttpResponse.json({}, { status: 500 }),
    ),
  );
  renderPage();
  await screen.findByText('회의록을 찾을 수 없습니다.');
  expect(
    localStorage.getItem(`aics:admin:read:${demoAdmin.id}:1:meetings`),
  ).toBeNull();
});
