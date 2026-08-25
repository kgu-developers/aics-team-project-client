import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import SubmissionFilePanel from './SubmissionFilePanel';

import {
  getSubmissionById,
  resetSubmissionMockData,
} from '~/mocks/data/submission';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { submissionHandlers } from '~/mocks/handlers/submission';

const submitRequest = vi.fn();
const server = setupServer(...submissionHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  submitRequest.mockClear();
  resetSubmissionMockData();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderPanel(isReadOnly = false) {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }

  return render(
    <SubmissionFilePanel
      isReadOnly={isReadOnly}
      milestoneId='presentation'
      title='프레젠테이션 자료'
    />,
    { wrapper: Wrapper },
  );
}

describe('SubmissionFilePanel', () => {
  it('keeps a selected file visible but blocks file replacement when the editor becomes read-only', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(':submissionId')}`,
        () => {
          submitRequest();
          return HttpResponse.json(
            getSubmissionById('submission-presentation'),
          );
        },
      ),
    );
    const { container, rerender } = renderPanel();
    const submitButton = await screen.findByRole('button', {
      name: '파일 교체',
    });
    const fileInput =
      container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) throw new Error('presentation file input is required');
    const file = new File(['slides'], 'cineflow-v2.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    await user.upload(fileInput, file);
    expect(screen.getByText(file.name)).toBeInTheDocument();

    rerender(
      <SubmissionFilePanel
        isReadOnly
        milestoneId='presentation'
        title='프레젠테이션 자료'
      />,
    );

    expect(fileInput).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getAllByText(
        '읽기 전용 상태에서는 파일을 선택하거나 교체할 수 없어요.',
      ),
    ).not.toHaveLength(0);

    const form = submitButton.closest('form');
    if (!form) throw new Error('submission form is required');
    fireEvent.submit(form);

    expect(submitRequest).not.toHaveBeenCalled();
    expect(screen.getByText(file.name)).toBeInTheDocument();
  });
});
