import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const contextFixture = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('~/shared/config/developmentMode', () => ({
  isMockDevelopmentMode: () => false,
}));
vi.mock('~/features/section/useStudentContext', () => ({
  useStudentContext: () => contextFixture.value,
}));

import StudentMessagesPage from './StudentMessagesPage';

const clients: QueryClient[] = [];

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AstryxThemeProvider>
  );
  return render(<StudentMessagesPage />, { wrapper: Wrapper });
}

beforeEach(() => {
  contextFixture.value = {
    status: 'loading',
    section: undefined,
    sections: [],
    selectSection: vi.fn(),
    isFetching: false,
    retry: vi.fn().mockResolvedValue(undefined),
  };
});

afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
});

it('학생 컨텍스트를 확인하는 동안 팀 미배정 안내로 바꾸지 않는다', () => {
  renderPage();

  expect(
    screen.getByText('소속 분반과 팀 정보를 확인하는 중이에요.'),
  ).toBeVisible();
  expect(screen.queryByText('쪽지함을 열 수 없어요.')).toBeNull();
});

it('학생 컨텍스트 조회 실패 시 공통 복구 상태에서 다시 시도한다', async () => {
  const retry = vi.fn().mockResolvedValue(undefined);
  contextFixture.value = {
    ...contextFixture.value,
    status: 'error',
    retry,
  };
  const user = userEvent.setup();
  renderPage();

  expect(screen.getByText('소속 정보를 불러오지 못했어요.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: '소속 정보 다시 시도' }));
  expect(retry).toHaveBeenCalledOnce();
  expect(screen.queryByText('쪽지함을 열 수 없어요.')).toBeNull();
});
