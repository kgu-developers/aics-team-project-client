import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import ProjectTopicBoard from './ProjectTopicBoard';

import { resetTopicMockData } from '~/mocks/data/topic';
import {
  demoCompletedAccessToken,
  demoCompletedStudent,
} from '~/mocks/data/users';
import { topicHandlers } from '~/mocks/handlers/topic';

const server = setupServer(...topicHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  resetTopicMockData();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});

afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  };
}

function signInCompletedStudent() {
  useAuthStore.getState().setAccessToken(demoCompletedAccessToken);
  useAuthStore.getState().setCurrentUser(demoCompletedStudent);
}

describe('ProjectTopicBoard', () => {
  it('선택한 후보를 다시 누르면 기존 투표를 취소한다', async () => {
    const user = userEvent.setup();
    resetTopicMockData({ selection: 'VOTING' });
    signInCompletedStudent();
    render(<ProjectTopicBoard embedded />, { wrapper: createWrapper() });

    const selectedCandidate = await screen.findByRole('radio', {
      name: 'CineFlow · 영화관 통합 관리 시스템',
    });
    expect(selectedCandidate).toBeChecked();

    await user.click(selectedCandidate);

    await waitFor(() => expect(selectedCandidate).not.toBeChecked());
    expect(screen.getByText('투표 참여 2/5명')).toBeInTheDocument();
  });
});
