import { API_BASE_URL } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
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

import LiveEditLockPanel from './LiveEditLockPanel';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  server.use(...createLiveEditLockHandlers());
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
function renderPanel(
  contractActions = false,
  targetType: 'PRESENTATION_CONTENT' | 'PROJECT' = 'PRESENTATION_CONTENT',
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <LiveEditLockPanel
          target={{ targetType, targetId: 19 }}
          allowContractActions={contractActions}
        />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}

it('기본 패널은 조회만 제공하고 편집과 잠금 mutation을 노출하지 않는다', async () => {
  renderPanel();
  expect(
    await screen.findByText('현재 확인된 편집 잠금이 없어요.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '편집 시작' })).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: '검수용 잠금 요청' }),
  ).not.toBeInTheDocument();
});

it('검수용 획득·해제 후에도 편집은 비활성 상태로 유지된다', async () => {
  renderPanel(true);
  const actor = userEvent.setup();
  await screen.findByText('현재 확인된 편집 잠금이 없어요.');
  await actor.click(screen.getByRole('button', { name: '검수용 잠금 요청' }));
  expect(
    await screen.findByText('현재 계정이 편집 잠금을 보유하고 있어요.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '편집 시작' })).toBeDisabled();
  await actor.click(screen.getByRole('button', { name: '검수용 잠금 해제' }));
  expect(
    await screen.findByText('현재 확인된 편집 잠금이 없어요.'),
  ).toBeVisible();
});

it('PROJECT는 지원 대기로 안내하며 live 요청을 보내지 않는다', () => {
  const requests = vi.fn();
  server.use(
    http.all(`${API_BASE_URL}/edit-locks`, () => {
      requests();
      return HttpResponse.json({ locked: false });
    }),
  );
  renderPanel(true, 'PROJECT');
  expect(
    screen.getByText('이 문서의 편집 잠금은 아직 지원하지 않아요.'),
  ).toBeVisible();
  expect(
    screen.getByRole('button', { name: '검수용 잠금 요청' }),
  ).toBeDisabled();
  expect(requests).not.toHaveBeenCalled();
});

it('잠금 조회 실패는 오류와 재확인 동작을 제공하고 편집은 계속 차단한다', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}/edit-locks`,
      () => new HttpResponse(null, { status: 503 }),
    ),
  );
  renderPanel();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    '확인하지 못했어요',
  );
  server.use(...createLiveEditLockHandlers());
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: '잠금 상태 다시 확인' }));
  expect(
    await screen.findByText('현재 확인된 편집 잠금이 없어요.'),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '편집 시작' })).toBeDisabled();
});
