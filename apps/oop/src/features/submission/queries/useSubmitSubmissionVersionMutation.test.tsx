import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { presentationKeys } from '~/features/presentation/queries';
import { useCurrentPresentationQuery } from '~/features/presentation/queries/useCurrentPresentationQuery';

import { useSubmitSubmissionVersionMutation } from './useSubmitSubmissionVersionMutation';

import {
  completePresentationBlock,
  getCurrentPresentation,
  resetPresentationMockData,
} from '~/mocks/data/presentation';
import { resetSubmissionMockData } from '~/mocks/data/submission';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { resetEditLockFixture } from '~/mocks/handlers/editLock';
import { presentationHandlers } from '~/mocks/handlers/presentation';
import { submissionHandlers } from '~/mocks/handlers/submission';

const server = setupServer(...presentationHandlers, ...submissionHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetPresentationMockData();
  resetSubmissionMockData();
  resetEditLockFixture();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useSubmitSubmissionVersionMutation', () => {
  it('파일 교체 성공 후 발표 문서 쿼리를 다시 조회해 상태와 버전을 반영한다', async () => {
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);

    const presentation = getCurrentPresentation();
    const material = presentation.blocks.find(
      block => block.key === 'presentation-material',
    );
    if (!material) throw new Error('presentation-material fixture is required');
    const completed = completePresentationBlock(
      material.key,
      presentation.version,
      demoStudent.name,
    );
    if (!completed) throw new Error('presentation-material should complete');

    const queryClient = createQueryClient();
    const wrapper = createWrapper(queryClient);
    const presentationQuery = renderHook(
      () => useCurrentPresentationQuery(true),
      { wrapper },
    );
    await waitFor(() =>
      expect(presentationQuery.result.current.isSuccess).toBe(true),
    );
    expect(presentationQuery.result.current.data?.version).toBe(
      completed.version,
    );

    const mutation = renderHook(
      () =>
        useSubmitSubmissionVersionMutation(
          'oop-2026-2-01',
          demoStudent.studentNumber,
        ),
      { wrapper },
    );
    await mutation.result.current.mutateAsync({
      submissionId: 'submission-presentation',
      input: {
        description: '파일을 교체했습니다.',
        artifacts: [
          {
            kind: 'LINK',
            label: '시연 URL',
            url: 'https://example.com/demo',
          },
          {
            kind: 'FILE',
            name: 'presentation-replaced.pdf',
            size: 1024,
            mimeType: 'application/pdf',
          },
          {
            kind: 'FILE',
            name: 'presentation-source.zip',
            size: 2048,
            mimeType: 'application/zip',
          },
        ],
      },
    });

    await waitFor(() =>
      expect(presentationQuery.result.current.data?.version).toBe(
        completed.version + 1,
      ),
    );
    expect(
      presentationQuery.result.current.data?.blocks.find(
        block => block.key === 'presentation-material',
      )?.status,
    ).toBe('IN_PROGRESS');
    expect(queryClient.getQueryData(presentationKeys.current())).toMatchObject({
      version: completed.version + 1,
    });
  });
});
