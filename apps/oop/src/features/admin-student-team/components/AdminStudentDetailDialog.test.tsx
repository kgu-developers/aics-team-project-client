import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import AdminStudentDetailDialog from './AdminStudentDetailDialog';

const server = setupServer();
const clients: QueryClient[] = [];
const student = {
  createdAt: '2026-09-08T15:13:03.631Z',
  email: 'student@example.com',
  globalRole: 'USER' as const,
  name: '김학생',
  phone: '010-1234-5678',
  studentNumber: '20260001',
  updatedAt: '2026-09-08T15:13:03.631Z',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
});
afterAll(() => server.close());

function renderDialog(onClose = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
  clients.push(client);

  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <AdminStudentDetailDialog
          allowPasswordReset
          studentNumber={student.studentNumber}
          onClose={onClose}
        />
        <ToastViewport />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );

  return { client, onClose };
}

function useStudentLookupHandler() {
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.USER(student.studentNumber)}`,
      () => HttpResponse.json(student),
    ),
  );
}

it.each([404, 500])(
  'displays supplied evaluation answers when unrelated user lookup returns %s',
  async status => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.USER('20260001')}`, () =>
        HttpResponse.json({}, { status }),
      ),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    render(
      <AstryxThemeProvider>
        <QueryClientProvider client={client}>
          <AdminStudentDetailDialog
            studentNumber='20260001'
            onClose={vi.fn()}
            details={<p>상호평가 응답: 역할 분담에 기여했습니다.</p>}
          />
        </QueryClientProvider>
      </AstryxThemeProvider>,
    );
    await screen.findByText('수강생 정보를 불러오지 못했습니다.');
    expect(
      screen.getByText('상호평가 응답: 역할 분담에 기여했습니다.'),
    ).toBeInTheDocument();
  },
);

it('waits for confirmation, calls the password reset endpoint, and reports success', async () => {
  const user = userEvent.setup();
  let requestCount = 0;
  let requestPath = '';
  let requestBody: string | undefined;
  useStudentLookupHandler();
  server.use(
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.USER_PASSWORD_RESET(student.studentNumber)}`,
      async ({ request }) => {
        requestCount += 1;
        requestPath = new URL(request.url).pathname;
        requestBody = await request.text();
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  const { onClose } = renderDialog();

  await user.click(
    await screen.findByRole('button', { name: '비밀번호 초기화' }),
  );
  const confirmation = await screen.findByRole('alertdialog', {
    name: `${student.name}(${student.studentNumber}) 비밀번호 초기화 확인`,
  });
  expect(requestCount).toBe(0);
  await waitFor(() =>
    expect(
      within(confirmation).getByRole('button', { name: '취소' }),
    ).toHaveFocus(),
  );
  expect(
    within(confirmation).getByText(
      /등록된 전화번호로 초기화되며, 기존 로그인 세션은 모두 해제됩니다/,
    ),
  ).toBeVisible();
  expect(within(confirmation).getByText(/초기화 후 30분 안에/)).toBeVisible();

  await user.click(
    within(confirmation).getByRole('button', { name: '초기화 확인' }),
  );

  await waitFor(() => expect(requestCount).toBe(1));
  expect(requestPath).toBe('/api/v1/admin/users/20260001/password/reset');
  expect(requestBody).toBe('');
  await waitFor(() =>
    expect(
      screen.queryByRole('alertdialog', {
        name: `${student.name}(${student.studentNumber}) 비밀번호 초기화 확인`,
      }),
    ).not.toBeInTheDocument(),
  );
  expect(onClose).toHaveBeenCalledOnce();
  expect(
    await screen.findByText(
      `${student.name} 학생의 비밀번호를 초기화했습니다.`,
    ),
  ).toBeInTheDocument();
});

it('keeps a failed reset open and allows the administrator to retry', async () => {
  const user = userEvent.setup();
  let requestCount = 0;
  useStudentLookupHandler();
  server.use(
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.USER_PASSWORD_RESET(student.studentNumber)}`,
      () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json(
              { code: 'RESET_FAILED', message: 'reset failed' },
              { status: 500 },
            )
          : new HttpResponse(null, { status: 204 });
      },
    ),
  );
  renderDialog();

  await user.click(
    await screen.findByRole('button', { name: '비밀번호 초기화' }),
  );
  const confirmation = await screen.findByRole('alertdialog', {
    name: `${student.name}(${student.studentNumber}) 비밀번호 초기화 확인`,
  });
  await user.click(
    within(confirmation).getByRole('button', { name: '초기화 확인' }),
  );

  expect(await within(confirmation).findByRole('alert')).toHaveTextContent(
    '잠시 후 다시 시도해 주세요',
  );
  expect(confirmation).toBeVisible();
  expect(
    within(confirmation).getByRole('button', { name: '초기화 확인' }),
  ).toBeEnabled();

  await user.click(
    within(confirmation).getByRole('button', { name: '초기화 확인' }),
  );
  await waitFor(() => expect(requestCount).toBe(2));
  await waitFor(() =>
    expect(
      screen.queryByRole('alertdialog', {
        name: `${student.name}(${student.studentNumber}) 비밀번호 초기화 확인`,
      }),
    ).not.toBeInTheDocument(),
  );
});
