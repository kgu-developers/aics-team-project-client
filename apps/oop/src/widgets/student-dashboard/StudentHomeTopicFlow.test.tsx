import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import StudentHomePage from './StudentHomePage';

import { resetMeetingMockData } from '~/mocks/data/meeting';
import { resetTopicMockData } from '~/mocks/data/topic';
import {
  demoCompletedAccessToken,
  demoCompletedStudent,
} from '~/mocks/data/users';
import { meetingHandlers } from '~/mocks/handlers/meeting';
import { studentHomeHandlers } from '~/mocks/handlers/studentHome';
import { submissionHandlers } from '~/mocks/handlers/submission';
import { topicHandlers } from '~/mocks/handlers/topic';

const server = setupServer(
  ...meetingHandlers,
  ...studentHomeHandlers,
  ...submissionHandlers,
  ...topicHandlers,
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
  resetMeetingMockData();
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
  it('선정된 주제 상태에서는 후보 투표 대신 제안서 작성 CTA를 표시한다', async () => {
    useAuthStore.getState().setAccessToken(demoCompletedAccessToken);
    useAuthStore.getState().setCurrentUser(demoCompletedStudent);
    render(<StudentHomePage />, { wrapper: createWrapper() });

    expect(await screen.findAllByText('제안서 작성')).not.toHaveLength(0);
    expect(screen.getByRole('button', { name: '작성하기' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: '후보 추가' }),
    ).not.toBeInTheDocument();
  });
});
