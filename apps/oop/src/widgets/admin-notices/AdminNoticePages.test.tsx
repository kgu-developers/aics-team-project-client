import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
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

import {
  plainTextToRichText,
  serializeRichTextContent,
} from '~/shared/lib/richTextContent';

import { noticeId } from '~/features/admin-notices/noticeScope';
import { useAuthStore } from '~/features/auth/authStore';

import {
  AdminNoticeDetailPage,
  AdminNoticeEditPage,
  AdminNoticeListPage,
  AdminNoticeNewPage,
} from './AdminNoticePages';

import { resetMockSessionState } from '~/mocks/authSession';
import {
  demoNoticeProfessor,
  demoNoticeProfessorAccessToken,
} from '~/mocks/data/users';
import {
  resetSectionAnnouncements,
  studentNoticeHandlers,
} from '~/mocks/handlers/studentNotices';

// ProseMirror needs a real layout engine; drive the notice body through a
// textarea that exchanges the same JSON document the real editor produces.
vi.mock('~/shared/ui/RichTextEditor', () => ({
  default: ({
    content,
    isDisabled,
    label,
    onChange,
  }: {
    content: import('@aics/core').RichTextJson;
    isDisabled?: boolean;
    label: string;
    onChange: (value: import('@aics/core').RichTextJson) => void;
  }) => (
    <textarea
      aria-label={label}
      disabled={isDisabled}
      onChange={event => onChange(plainTextToRichText(event.target.value))}
      value={((content.content as { content?: { text?: string }[] }[]) ?? [])
        .map(paragraph => paragraph.content?.[0]?.text ?? '')
        .join('\n')}
    />
  ),
}));

const server = setupServer(...studentNoticeHandlers);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMockSessionState();
  resetSectionAnnouncements();
  setApiAccessToken(demoNoticeProfessorAccessToken);
  useAuthStore.setState({
    currentUser: demoNoticeProfessor,
    accessToken: demoNoticeProfessorAccessToken,
  });
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.setState({ currentUser: null, accessToken: null });
});
afterAll(() => server.close());
function renderPage(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const root = createRootRoute({
    component: () => (
      <AstryxThemeProvider>
        <QueryClientProvider client={client}>
          <Outlet />
        </QueryClientProvider>
      </AstryxThemeProvider>
    ),
  });
  const notices = createRoute({
    getParentRoute: () => root,
    path: '/admin/notices',
    component: Outlet,
    validateSearch: (search: Record<string, unknown>) => ({
      sectionId: noticeId(search.sectionId),
    }),
  });
  const detail = createRoute({
    getParentRoute: () => notices,
    path: '$noticeId',
    component: Outlet,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
    routeTree: root.addChildren([
      notices.addChildren([
        createRoute({
          getParentRoute: () => notices,
          path: '/',
          component: AdminNoticeListPage,
        }),
        createRoute({
          getParentRoute: () => notices,
          path: 'new',
          component: AdminNoticeNewPage,
        }),
        detail.addChildren([
          createRoute({
            getParentRoute: () => detail,
            path: '/',
            component: AdminNoticeDetailPage,
          }),
          createRoute({
            getParentRoute: () => detail,
            path: 'edit',
            component: AdminNoticeEditPage,
          }),
        ]),
      ]),
    ]),
  });
  render(<RouterProvider router={router} />);
  return { client, router };
}
async function fill() {
  const user = userEvent.setup();
  await user.type(
    await screen.findByRole('textbox', { name: '제목' }),
    '새 공지',
  );
  await user.type(
    screen.getByRole('textbox', { name: '내용' }),
    '첫 줄\n둘째 줄',
  );
  return user;
}

it('목록과 상세가 오프셋 없는 게시일을 호스트 TZ와 무관하게 표시한다', async () => {
  const user = userEvent.setup();
  renderPage('/admin/notices?sectionId=1');
  const row = await screen.findByRole('row', {
    name: /이미지 자료 확인 안내 공지사항 보기/,
  });
  expect(within(row).getByText('2026-08-28/00:00')).toBeInTheDocument();
  await user.click(row);
  expect(
    await screen.findByText('게시일시 : 2026-08-28/00:00'),
  ).toBeInTheDocument();
});

it('선택한 한 분반에 제목·본문만 게시하고 상세·목록 재조회에 같은 숫자 ID를 사용한다', async () => {
  const requests: unknown[] = [];
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST')
      void request
        .clone()
        .json()
        .then(body => requests.push(body));
  });
  const { router, client } = renderPage('/admin/notices/new?sectionId=1');
  const user = await fill();
  expect(screen.queryByLabelText('첨부 파일')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '등록' }));
  const row = await screen.findByRole('row', { name: /새 공지 공지사항 보기/ });
  expect(router.state.location.href).toBe('/admin/notices?sectionId=1');
  await user.click(row);
  await screen.findByRole('heading', { level: 2, name: '새 공지' });
  expect(
    within(screen.getByRole('region', { name: '공지 내용' })).getByText(
      '둘째 줄',
    ),
  ).toBeInTheDocument();
  expect(requests).toEqual([
    {
      title: '새 공지',
      content: serializeRichTextContent(plainTextToRichText('첫 줄\n둘째 줄')),
    },
  ]);
  expect(router.state.location.href).toBe('/admin/notices/13?sectionId=1');
  await act(() => client.refetchQueries());
  expect(screen.getByText('첫 줄')).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: '← 공지사항 목록으로' }));
  expect(
    await screen.findByRole('row', { name: /새 공지 공지사항 보기/ }),
  ).toHaveAttribute('tabindex', '0');
  server.events.removeAllListeners();
});
it('편집은 분반을 고정하고 변경된 필드만 PATCH하여 게시일과 ID를 유지한다', async () => {
  const patch = vi.fn();
  server.use(
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.DETAIL('10')}`,
      async ({ request }) => {
        patch(await request.json());
        return HttpResponse.json({
          id: 10,
          sectionId: 1,
          title: '수정 제목',
          content:
            '공지 본문과 게시일시가 학생 화면에 표시되는지 확인해 주세요.',
          publishedAt: '2026-08-27 15:00',
        });
      },
    ),
  );
  const { router } = renderPage('/admin/notices/10/edit?sectionId=1');
  const user = userEvent.setup();
  const title = await screen.findByRole('textbox', { name: '제목' });
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
  expect(
    screen.queryByRole('combobox', { name: '분반' }),
  ).not.toBeInTheDocument();
  await user.clear(title);
  await user.type(title, '수정 제목');
  await user.click(screen.getByRole('button', { name: '저장' }));
  await waitFor(() =>
    expect(router.state.location.href).toBe('/admin/notices/10?sectionId=1'),
  );
  expect(patch).toHaveBeenCalledExactlyOnceWith({ title: '수정 제목' });
});
it('새 공지 초안에서 취소한 이동은 입력을 보존하고 확인 후에만 목록으로 이동한다', async () => {
  const { router } = renderPage('/admin/notices/new?sectionId=1');
  const user = await fill();

  await user.click(screen.getByRole('button', { name: '취소' }));
  const dialog = await screen.findByRole('alertdialog', {
    name: '저장하지 않은 내용이 있어요.',
  });
  await user.click(within(dialog).getByRole('button', { name: '계속 작성' }));

  expect(router.state.location.href).toBe('/admin/notices/new?sectionId=1');
  expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('새 공지');
  expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue(
    '첫 줄\n둘째 줄',
  );

  await user.click(screen.getByRole('button', { name: '취소' }));
  await user.click(
    within(
      await screen.findByRole('alertdialog', {
        name: '저장하지 않은 내용이 있어요.',
      }),
    ).getByRole('button', { name: '변경 버리고 이동' }),
  );
  await waitFor(() =>
    expect(router.state.location.href).toBe('/admin/notices?sectionId=1'),
  );
});
it('기존 공지 수정 초안은 목록 링크 이동을 막고 취소하면 입력을 유지한다', async () => {
  const { router } = renderPage('/admin/notices/10/edit?sectionId=1');
  const user = userEvent.setup();
  const title = await screen.findByRole('textbox', { name: '제목' });
  await user.clear(title);
  await user.type(title, '이동 전 수정 제목');

  await user.click(screen.getByRole('link', { name: '← 공지사항 목록으로' }));
  const dialog = await screen.findByRole('alertdialog', {
    name: '저장하지 않은 내용이 있어요.',
  });
  await user.click(within(dialog).getByRole('button', { name: '계속 작성' }));

  expect(router.state.location.href).toBe('/admin/notices/10/edit?sectionId=1');
  expect(title).toHaveValue('이동 전 수정 제목');
});
it('실제 계약 핸들러로 수정한 전체 본문을 상세 재조회에 표시한다', async () => {
  const { client } = renderPage('/admin/notices/10/edit?sectionId=1');
  const user = userEvent.setup();
  const body = await screen.findByRole('textbox', { name: '내용' });
  await user.clear(body);
  await user.type(body, '<script>escaped</script>\n수정 둘째 줄');
  await user.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('<script>escaped</script>');
  await act(() => client.refetchQueries());
  expect(screen.getByText('수정 둘째 줄')).toBeInTheDocument();
  expect(
    screen.getByRole('region', { name: '공지 내용' }).querySelectorAll('p'),
  ).toHaveLength(2);
  expect(document.querySelector('script')).toBeNull();
});
it.each([
  '/admin/notices/10',
  '/admin/notices/10?sectionId=2',
  '/admin/notices/10?sectionId=bad',
  '/admin/notices/not-numeric?sectionId=1',
])('누락·부적합 범위 %s는 API 요청 없이 안내한다', async path => {
  const get = vi.fn(() => HttpResponse.json({ contents: [] }));
  server.use(
    http.get(`${API_BASE_URL}/api/v1/sections/:id/announcements`, get),
  );
  renderPage(path);
  await screen.findByText(
    /담당 분반을 선택해 주세요.|공지사항을 찾을 수 없어요./,
  );
  expect(get).not.toHaveBeenCalled();
});
it('선택 분반과 다른 응답 공지는 상세에 노출하지 않는다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/api/v1/sections/1/announcements`, () =>
      HttpResponse.json({
        contents: [
          {
            id: 10,
            sectionId: 2,
            title: '다른 분반 비밀',
            content: '노출 금지',
            publishedAt: '2026-08-27 15:00',
          },
        ],
      }),
    ),
  );
  renderPage('/admin/notices/10?sectionId=1');
  await screen.findByRole('heading', { name: '공지사항을 찾을 수 없어요.' });
  expect(screen.queryByText('노출 금지')).not.toBeInTheDocument();
});
it.each([400, 403, 500])(
  '%s 게시 오류에서 입력을 보존하고 자동 재시도하지 않는다',
  async status => {
    const post = vi.fn(() => new HttpResponse(null, { status }));
    server.use(
      http.post(`${API_BASE_URL}/api/v1/sections/1/announcements`, post),
    );
    renderPage('/admin/notices/new?sectionId=1');
    const user = await fill();
    await user.click(screen.getByRole('button', { name: '등록' }));
    await screen.findByText(/게시하지 못했습니다\. 입력 내용을 유지했으니/);
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue(
      '새 공지',
    );
    expect(screen.getByRole('textbox', { name: '내용' })).toHaveValue(
      '첫 줄\n둘째 줄',
    );
    expect(post).toHaveBeenCalledOnce();
  },
);
it('부분 게시 실패 뒤에는 실패한 분반에만 다시 게시한다', async () => {
  useAuthStore.setState({
    currentUser: {
      ...demoNoticeProfessor,
      sections: [
        ...demoNoticeProfessor.sections,
        { ...demoNoticeProfessor.sections[0]!, id: '2', code: '실패 분반' },
      ],
    },
  });
  const postedSectionIds: string[] = [];
  server.use(
    http.post(
      `${API_BASE_URL}/api/v1/sections/:sectionId/announcements`,
      ({ params }) => {
        const sectionId = String(params.sectionId);
        postedSectionIds.push(sectionId);
        return sectionId === '2'
          ? new HttpResponse(null, { status: 500 })
          : new HttpResponse(null, { status: 201 });
      },
    ),
  );
  renderPage('/admin/notices/new?sectionId=1');
  const user = await fill();
  await user.click(screen.getByRole('combobox', { name: '분반' }));
  await user.click(screen.getByRole('option', { name: /실패 분반/ }));
  await user.click(screen.getByRole('button', { name: '등록' }));
  await screen.findByText(
    /1개 분반에는 게시했지만 1개 분반에는 게시하지 못했습니다\./,
  );
  expect(postedSectionIds.sort()).toEqual(['1', '2']);

  await user.click(screen.getByRole('button', { name: '등록' }));
  await waitFor(() => expect(postedSectionIds).toEqual(['1', '2', '2']));
});

it('저장 대기 동안 중복 제출을 막는다', async () => {
  let finish!: () => void;
  const pending = new Promise<void>(resolve => {
    finish = resolve;
  });
  const post = vi.fn(async () => {
    await pending;
    return new HttpResponse(null, { status: 500 });
  });
  server.use(
    http.post(`${API_BASE_URL}/api/v1/sections/1/announcements`, post),
  );
  renderPage('/admin/notices/new?sectionId=1');
  const user = await fill();
  await user.click(screen.getByRole('button', { name: '등록' }));
  await waitFor(() => expect(post).toHaveBeenCalledOnce());
  expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
  expect(screen.getByRole('textbox', { name: '제목' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: '등록' }));
  await act(async () => finish());
  await screen.findByText(
    /0개 분반에는 게시했지만 1개 분반에는 게시하지 못했습니다\./,
  );
  expect(post).toHaveBeenCalledOnce();
});
it('교수 자격·유효한 제목·본문이 없으면 저장을 허용하지 않는다', async () => {
  renderPage('/admin/notices/new?sectionId=1');
  await screen.findByRole('textbox', { name: '제목' });
  expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
  const user = await fill();
  await user.clear(screen.getByRole('textbox', { name: '내용' }));
  await user.type(screen.getByRole('textbox', { name: '내용' }), '   ');
  expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
  await act(() =>
    useAuthStore.setState({
      currentUser: { ...demoNoticeProfessor, globalRole: 'ASSISTANT' },
    }),
  );
  await user.type(screen.getByRole('textbox', { name: '내용' }), '본문');
  expect(screen.getByRole('button', { name: '등록' })).toBeDisabled();
});

it('비활성 담당 분반에서는 유효한 제목과 본문이 있어도 게시 요청을 보내지 않는다', async () => {
  const post = vi.fn(() => new HttpResponse(null, { status: 201 }));
  server.use(
    http.post(`${API_BASE_URL}/api/v1/sections/1/announcements`, post),
  );
  useAuthStore.setState({
    currentUser: {
      ...demoNoticeProfessor,
      sections: demoNoticeProfessor.sections.map(section => ({
        ...section,
        status: 'ARCHIVED',
      })),
    },
  });
  renderPage('/admin/notices/new?sectionId=1');
  const user = await fill();
  expect(
    screen.getByText('담당 교수의 활성 분반을 선택해 주세요.'),
  ).toBeInTheDocument();
  const save = screen.getByRole('button', { name: '등록' });
  expect(save).toBeDisabled();
  await user.click(save);
  expect(post).not.toHaveBeenCalled();
});

it('전체 분반 목록은 기본값이며 비활성 분반도 목록에서 조회하고 필터를 바꿀 수 있다', async () => {
  useAuthStore.setState({
    currentUser: {
      ...demoNoticeProfessor,
      sections: [
        ...demoNoticeProfessor.sections,
        {
          ...demoNoticeProfessor.sections[0]!,
          id: '2',
          code: '보관 분반',
          status: 'ARCHIVED',
        },
      ],
    },
  });
  const get = vi.fn();
  server.use(
    http.get(
      `${API_BASE_URL}/api/v1/sections/:sectionId/announcements`,
      ({ params }) => {
        get(params.sectionId);
        return HttpResponse.json({
          contents: [
            {
              id: Number(params.sectionId),
              sectionId: Number(params.sectionId),
              title: `분반 ${params.sectionId} 공지`,
              content: '내용',
              publishedAt: '2026-09-16T09:00:00',
            },
          ],
        });
      },
    ),
  );
  const { router } = renderPage('/admin/notices');
  const user = userEvent.setup();
  expect(
    await screen.findByRole('row', { name: /분반 1 공지 공지사항 보기/ }),
  ).toHaveAttribute('tabindex', '0');
  expect(
    await screen.findByRole('row', { name: /분반 2 공지 공지사항 보기/ }),
  ).toHaveAttribute('tabindex', '0');
  expect(get.mock.calls.map(([id]) => id).sort()).toEqual(['1', '2']);
  await user.click(screen.getByRole('combobox', { name: '분반' }));
  await user.click(screen.getByRole('option', { name: '보관 분반' }));
  await waitFor(() =>
    expect(router.state.location.href).toBe('/admin/notices?sectionId=2'),
  );
  expect(
    screen.queryByRole('row', { name: /분반 1 공지 공지사항 보기/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('row', { name: /분반 2 공지 공지사항 보기/ }),
  ).toBeInTheDocument();
});

it('전체 분반의 부분 실패는 성공 목록과 오류 안내를 함께 표시한다', async () => {
  useAuthStore.setState({
    currentUser: {
      ...demoNoticeProfessor,
      sections: [
        ...demoNoticeProfessor.sections,
        { ...demoNoticeProfessor.sections[0]!, id: '2', code: '실패 분반' },
      ],
    },
  });
  server.use(
    http.get(
      `${API_BASE_URL}/api/v1/sections/2/announcements`,
      () => new HttpResponse(null, { status: 500 }),
    ),
  );
  renderPage('/admin/notices');
  expect(
    await screen.findByRole('row', {
      name: /이미지 자료 확인 안내 공지사항 보기/,
    }),
  ).toBeInTheDocument();
  expect(
    await screen.findByText('일부 분반의 공지사항을 불러오지 못했습니다.'),
  ).toBeInTheDocument();
  expect(
    screen.queryByText('등록된 공지사항이 없어요.'),
  ).not.toBeInTheDocument();
});
