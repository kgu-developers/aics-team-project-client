import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import StudentHomePage from './StudentHomePage';

import { resetTopicMockData } from '~/mocks/data/topic';
import {
  demoCompletedAccessToken,
  demoCompletedStudent,
} from '~/mocks/data/users';
import { studentHomeHandlers } from '~/mocks/handlers/studentHome';
import { topicHandlers } from '~/mocks/handlers/topic';

const server = setupServer(...studentHomeHandlers, ...topicHandlers);
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
  resetTopicMockData();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});

afterAll(() => {
  server.close();
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ['/student'] }),
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <RouterContextProvider router={router}>
            {children}
          </RouterContextProvider>
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  };
}

describe('StudentHomeTopicFlow', () => {
  it('제안서 단계를 접은 상태에서도 후보 추가 Dialog를 표시한다', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setAccessToken(demoCompletedAccessToken);
    useAuthStore.getState().setCurrentUser(demoCompletedStudent);
    render(<StudentHomePage />, { wrapper: createWrapper() });

    await screen.findByRole('radio', { name: '영화관 관리 프로그램' });
    const proposalTrigger = screen.getByRole('button', {
      name: /제안서기간 : 20260928/,
    });
    await user.click(proposalTrigger);
    expect(proposalTrigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: '후보 추가' }));

    expect(
      screen.getByRole('dialog', { name: '주제 후보 추가' }),
    ).toBeInTheDocument();
  });
});
