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
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { adminNoticeKeys } from '~/features/admin-notices/queries/adminNoticeKeys';
import { useAuthStore } from '~/features/auth/authStore';

import {
  AdminNoticeDetailPage,
  AdminNoticeEditPage,
  DeleteNoticeDialog,
} from './AdminNoticePages';

import { adminNoticeDetails, adminNotices } from '~/mocks/data/adminNotices';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import {
  adminNoticeHandlers,
  resetAdminNoticeAttachments,
} from '~/mocks/handlers/adminNotices';

const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);

beforeAll(() => {
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

afterAll(() => {
  if (originalDialogShowModalDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      ...originalDialogShowModalDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  }

  if (originalDialogCloseDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      ...originalDialogCloseDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

function NoticeDialogTestHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} type='button'>
        삭제
      </button>
      <DeleteNoticeDialog
        detail={{ ...adminNoticeDetails['1'], notice: adminNotices[0] }}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function renderDialog() {
  return render(
    <AstryxThemeProvider>
      <NoticeDialogTestHarness />
    </AstryxThemeProvider>,
  );
}

describe('AdminNoticeDetailPage 삭제 모달', () => {
  it('삭제 버튼으로 모달을 열고 공지 내용을 표시한 뒤 취소할 수 있다', async () => {
    const user = userEvent.setup();

    renderDialog();
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    await user.click(deleteButton);

    const dialog = await screen.findByRole('dialog', {
      name: '공지사항 삭제 확인',
    });
    expect(
      within(dialog).getByRole('heading', {
        name: '이 공지사항을 삭제할까요?',
      }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('전체 접수 공지')).toBeInTheDocument();
    expect(
      within(dialog).getByText('분반별 제출 일정과 공지사항을 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: '취소' }));

    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(deleteButton).toHaveFocus();
  });

  it('Escape로 삭제 모달을 닫고 원래 삭제 버튼으로 포커스를 돌려준다', async () => {
    const user = userEvent.setup();

    renderDialog();
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    await user.click(deleteButton);
    const dialog = await screen.findByRole('dialog', {
      name: '공지사항 삭제 확인',
    });

    await user.keyboard('{Escape}');

    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(deleteButton).toHaveFocus();
  });
});

const server = setupServer(...adminNoticeHandlers);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  resetAdminNoticeAttachments();
  setApiAccessToken(null);
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
function renderEdit() {
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    currentUser: demoAdmin,
    accessToken: demoAdminAccessToken,
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  client.setQueryData(adminNoticeKeys.list(), { notices: [] });
  const root = createRootRoute();
  const notice = createRoute({
    getParentRoute: () => root,
    path: '/admin/notices/$noticeId',
  });
  const detail = createRoute({
    getParentRoute: () => notice,
    path: '/',
    component: AdminNoticeDetailPage,
  });
  const edit = createRoute({
    getParentRoute: () => notice,
    path: '/edit',
    component: AdminNoticeEditPage,
  });
  const router = createRouter({
    routeTree: root.addChildren([notice.addChildren([detail, edit])]),
    history: createMemoryHistory({ initialEntries: ['/admin/notices/1/edit'] }),
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return client;
}
it('removes attachments through DELETE and refetch, preserves editing drafts, and stays removed on detail navigation', async () => {
  const user = userEvent.setup();
  const client = renderEdit();
  const title = await screen.findByRole('textbox', { name: '제목' });
  await user.clear(title);
  await user.type(title, '유지할 제목 초안');
  await user.click(screen.getByRole('button', { name: '기존 파일 삭제' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: '기존 파일 삭제' }),
    ).not.toBeInTheDocument(),
  );
  expect(title).toHaveValue('유지할 제목 초안');
  expect(client.getQueryState(adminNoticeKeys.list())?.isInvalidated).toBe(
    true,
  );
  await act(async () => {
    await client.refetchQueries({ queryKey: adminNoticeKeys.detail('1') });
  });
  expect(title).toHaveValue('유지할 제목 초안');
  expect(
    screen.queryByText(`📎 ${adminNoticeDetails['1']!.attachment}`),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '취소' }));
  await screen.findByRole('heading', { name: /공지사항 > / });
  expect(
    screen.queryByText(`📎 ${adminNoticeDetails['1']!.attachment}`),
  ).not.toBeInTheDocument();
});
it('preserves an attachment when deletion fails', async () => {
  server.use(
    http.delete(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.NOTICE_ATTACHMENT('1')}`,
      () => HttpResponse.json({}, { status: 500 }),
    ),
  );
  renderEdit();
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: '기존 파일 삭제' }));
  await screen.findByText('첨부 파일 삭제에 실패했습니다. 다시 시도해 주세요.');
  expect(
    screen.getByText(`📎 ${adminNoticeDetails['1']!.attachment}`),
  ).toBeInTheDocument();
});

it('formats an offset-bearing notice timestamp consistently in edit and detail', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.NOTICE_DETAIL('1')}`, () =>
      HttpResponse.json({
        ...adminNoticeDetails['1'],
        notice: adminNotices[0],
        createdAt: '2026-09-01T23:30:00Z',
      }),
    ),
  );
  renderEdit();
  expect(await screen.findByText('작성일 : 2026.09.02 08:30')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: '취소' }));
  await screen.findByRole('heading', { name: /공지사항 > / });
  expect(screen.getByText('작성일 : 2026.09.02 08:30')).toBeVisible();
});
