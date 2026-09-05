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

function renderPanel(
  isReadOnly = false,
  milestoneId: 'presentation' | 'final-report' = 'presentation',
) {
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
      milestoneId={milestoneId}
      title={milestoneId === 'presentation' ? '프레젠테이션 자료' : '최종 파일'}
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
    expect(fileInput).toHaveAttribute('accept', '.pdf');
    const file = new File(['slides'], 'cineflow-v2.pdf', {
      type: 'application/pdf',
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

  it('시연 URL, PDF, ZIP을 발표 제출 payload로 보낸다', async () => {
    const user = userEvent.setup();
    let requestBody: unknown = null;
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(':submissionId')}`,
        async ({ request }) => {
          submitRequest();
          requestBody = await request.json();
          return HttpResponse.json(
            getSubmissionById('submission-presentation'),
          );
        },
      ),
    );
    const { container } = renderPanel();

    await user.type(
      await screen.findByRole('textbox', { name: /시연 URL/ }),
      'https://example.com/demo',
    );
    const fileInputs =
      container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    expect(fileInputs).toHaveLength(2);
    expect(fileInputs[0]).toHaveAttribute('accept', '.pdf');
    expect(fileInputs[1]).toHaveAttribute('accept', '.zip');
    await user.upload(
      fileInputs[0]!,
      new File(['slides'], 'cineflow.pdf', { type: 'application/pdf' }),
    );
    await user.upload(
      fileInputs[1]!,
      new File(['source'], 'cineflow.zip', { type: 'application/zip' }),
    );
    await user.click(screen.getByRole('button', { name: '파일 교체' }));

    expect(submitRequest).toHaveBeenCalledOnce();
    expect(requestBody).toMatchObject({
      artifacts: [
        {
          kind: 'LINK',
          label: '시연 URL',
          url: 'https://example.com/demo',
        },
        { kind: 'FILE', name: 'cineflow.pdf' },
        { kind: 'FILE', name: 'cineflow.zip' },
      ],
    });
  });

  it('최종 파일은 승인 입력 없이 PDF와 ZIP만 제출한다', async () => {
    const user = userEvent.setup();
    let requestBody: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(':submissionId')}`,
        async ({ request }) => {
          submitRequest();
          requestBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(
            getSubmissionById('submission-final-report'),
          );
        },
      ),
    );
    const { container } = renderPanel(false, 'final-report');

    expect(
      screen.queryByRole('checkbox', {
        name: '최종 제출 내용에 동의합니다.',
      }),
    ).not.toBeInTheDocument();
    await screen.findByRole('button', { name: '파일 제출' });
    const fileInputs =
      container.querySelectorAll<HTMLInputElement>('input[type="file"]');
    await user.upload(
      fileInputs[0]!,
      new File(['report'], 'final.pdf', { type: 'application/pdf' }),
    );
    await user.upload(
      fileInputs[1]!,
      new File(['source'], 'source.zip', { type: 'application/zip' }),
    );
    await user.click(screen.getByRole('button', { name: '파일 제출' }));

    expect(submitRequest).toHaveBeenCalledOnce();
    expect(requestBody).toMatchObject({
      artifacts: [
        { kind: 'FILE', name: 'final.pdf' },
        { kind: 'FILE', name: 'source.zip' },
      ],
    });
    expect(requestBody).not.toHaveProperty('consentConfirmed');
  });
});
