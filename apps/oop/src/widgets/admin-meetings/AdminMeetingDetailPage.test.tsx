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
import { render, screen, within } from '@testing-library/react';
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

it('formats an ISO rollover in Seoul without creating a local read record', async () => {
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
  expect(
    localStorage.getItem(`aics:admin:read:${demoAdmin.id}:1:meetings`),
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

it.each([
  [
    'serialized rich text',
    JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '읽을 수 있는 회의 본문' }],
        },
      ],
    }),
    '읽을 수 있는 회의 본문',
  ],
  ['plain text', '기존 일반 텍스트', '기존 일반 텍스트'],
  [
    'HTML-looking text',
    '<img src=x onerror=alert(1)>',
    '<img src=x onerror=alert(1)>',
  ],
  [
    'empty document',
    '{"type":"doc","content":[]}',
    '작성된 회의 내용이 없습니다.',
  ],
  ['empty string', '', '작성된 회의 내용이 없습니다.'],
])(
  'renders %s readably without raw serialized JSON or mutation controls',
  async (_name, content, expected) => {
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
            title: '본문 회귀',
            content,
            participantIds: [],
            authorId: '20260001',
            meetingAt: '2026-09-01T14:30:00+09:00',
            updatedAt: '2026-09-01T14:30:00+09:00',
          }),
      ),
    );
    const { container } = renderPage();
    expect(
      await screen.findByText(expected, { exact: true }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toContain('"type":"doc"');
    expect(container.textContent).not.toContain('"content"');
    expect(container.querySelector('[contenteditable="true"], img')).toBeNull();
    expect(
      screen.queryByRole('button', { name: /수정|삭제|저장/ }),
    ).not.toBeInTheDocument();
  },
);

it('preserves multiple paragraphs and list items as read-only structure, escaping text', async () => {
  const paragraph = (text: string) => ({
    type: 'paragraph',
    content: [{ type: 'text', text }],
  });
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
          title: '구조 확인',
          participantIds: [],
          authorId: '20260001',
          meetingAt: '2026-09-01T14:30:00+09:00',
          content: JSON.stringify({
            type: 'doc',
            content: [
              paragraph('첫 문단: 안건 정리'),
              paragraph('둘째 문단: 일정 확정'),
              {
                type: 'bulletList',
                content: [
                  { type: 'listItem', content: [paragraph('김OO 자료 준비')] },
                  {
                    type: 'listItem',
                    content: [paragraph('<script>담당자 확인</script>')],
                  },
                ],
              },
            ],
          }),
        }),
    ),
  );
  const { container } = renderPage();
  const first = await screen.findByText('첫 문단: 안건 정리');
  const second = screen.getByText('둘째 문단: 일정 확정');
  expect(first.tagName).toBe('P');
  expect(second.tagName).toBe('P');
  expect(first.nextElementSibling).toBe(second);
  const list = screen.getByRole('list');
  expect(list.tagName).toBe('UL');
  expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  expect(within(list).getByText('김OO 자료 준비')).toBeInTheDocument();
  expect(
    within(list).getByText('<script>담당자 확인</script>'),
  ).toBeInTheDocument();
  expect(
    container.querySelector('script, [contenteditable="true"]'),
  ).toBeNull();
  expect(container.textContent).not.toContain('"type":"doc"');
});
