import {
  AstryxThemeProvider,
  Button,
  ToastViewport,
} from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import TopicCandidateDialog from './TopicCandidateDialog';
import {
  TopicCandidateDialogProvider,
  useTopicCandidateDialog,
} from './TopicCandidateDialogContext';

import { resetTopicMockData } from '~/mocks/data/topic';
import {
  demoCompletedAccessToken,
  demoCompletedStudent,
} from '~/mocks/data/users';
import { topicHandlers } from '~/mocks/handlers/topic';

const server = setupServer(...topicHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetTopicMockData({ selection: 'VOTING' });
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function Wrapper({ children }: PropsWithChildren) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return (
    <AstryxThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastViewport>
          <TopicCandidateDialogProvider>
            {children}
          </TopicCandidateDialogProvider>
        </ToastViewport>
      </QueryClientProvider>
    </AstryxThemeProvider>
  );
}

function Harness() {
  const { setIsOpen } = useTopicCandidateDialog();

  return (
    <>
      <Button label='후보 추가 열기' onClick={() => setIsOpen(true)} />
      <TopicCandidateDialog />
    </>
  );
}

describe('TopicCandidateDialog', () => {
  it('후보를 추가하면 성공을 알리고 다음 작성 상태를 초기화한다', async () => {
    const user = userEvent.setup();
    resetTopicMockData({ selection: 'VOTING' });
    useAuthStore.getState().setAccessToken(demoCompletedAccessToken);
    useAuthStore.getState().setCurrentUser(demoCompletedStudent);
    render(<Harness />, { wrapper: Wrapper });

    await user.click(screen.getByRole('button', { name: '후보 추가 열기' }));
    await user.type(screen.getByLabelText('후보 제목'), '모바일 주제 후보');
    await user.type(
      screen.getByLabelText('후보 설명'),
      '작은 화면에서도 검수할 수 있는 주제입니다.',
    );
    await user.click(screen.getByRole('button', { name: /^후보 추가$/ }));

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: '주제 후보 추가' }),
      ).not.toBeInTheDocument();
    });
    expect(
      await screen.findByText('주제 후보를 추가했어요.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '후보 추가 열기' }));
    expect(screen.getByLabelText('후보 제목')).toHaveValue('');
    expect(screen.getByLabelText('후보 설명')).toHaveValue('');
  });
});
