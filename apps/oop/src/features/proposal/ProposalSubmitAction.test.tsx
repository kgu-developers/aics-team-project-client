import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import ProposalSubmitAction from './ProposalSubmitAction';

import {
  createProjectProposalFixture,
  createProposalSectionsFixture,
} from '~/mocks/data/projectProposal';
import { demoStudent, demoAccessToken } from '~/mocks/data/users';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});

it('동일 렌더에서 연속 클릭해도 한 번만 제출하고 실패 후에는 다시 시도할 수 있다', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '19' });
  const project = createProjectProposalFixture();
  const sections = createProposalSectionsFixture();
  sections.allCompleted = true;
  sections.contents.forEach(section => {
    section.completed = true;
  });
  const posts = vi.fn();
  let fail = true;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('19')}`, () =>
      HttpResponse.json(project),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.SECTIONS(19)}`, () =>
      HttpResponse.json(sections),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`, () =>
      HttpResponse.json({ locked: false }),
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.COMPLETE(19)}`,
      () => {
        posts();
        if (fail)
          return HttpResponse.json({ message: '제출 실패' }, { status: 503 });
        project.proposalCompletedAt = '2026-09-14T00:00:00';
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  const view = render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <ToastViewport>
          <ProposalSubmitAction label='제출하기' />
        </ToastViewport>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  try {
    const button = screen.getByRole('button', { name: '제출하기' });
    await waitFor(() => expect(button).toBeEnabled());
    // Deliver both clicks before React commits the mutation's pending state.
    act(() => {
      button.click();
      button.click();
    });
    await waitFor(() => expect(posts).toHaveBeenCalled());
    await waitFor(() => expect(button).toBeEnabled());
    expect(posts).toHaveBeenCalledTimes(1);
    fail = false;
    await userEvent.click(button);
    expect(await screen.findByText('제안서를 제출했어요.')).toBeInTheDocument();
    expect(posts).toHaveBeenCalledTimes(2);
  } finally {
    view.unmount();
    client.clear();
  }
});
it('문서와 영역 상태를 모두 읽기 전에는 제출을 막고 조회 완료 후 한 번 제출한다', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '19' });
  const project = createProjectProposalFixture();
  const sections = createProposalSectionsFixture();
  sections.allCompleted = true;
  sections.contents.forEach(section => {
    section.completed = true;
  });
  let releaseProject!: () => void;
  let releaseSections!: () => void;
  const projectPending = new Promise<void>(resolve => {
    releaseProject = resolve;
  });
  const sectionsPending = new Promise<void>(resolve => {
    releaseSections = resolve;
  });
  let sectionReads = 0;
  let posts = 0;
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('19')}`,
      async () => {
        await projectPending;
        return HttpResponse.json(project);
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.SECTIONS(19)}`,
      async () => {
        sectionReads++;
        await sectionsPending;
        return HttpResponse.json(sections);
      },
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`, () =>
      HttpResponse.json({ locked: false }),
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.COMPLETE(19)}`,
      () => {
        posts++;
        project.proposalCompletedAt = '2026-09-14T00:00:00';
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  const view = render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <ToastViewport>
          <ProposalSubmitAction label='제출하기' />
        </ToastViewport>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  try {
    const button = screen.getByRole('button', { name: '제출하기' });
    expect(button).toBeDisabled();
    releaseProject();
    await waitFor(() => expect(sectionReads).toBe(1));
    expect(button).toBeDisabled();
    releaseSections();
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.click(button);
    expect(await screen.findByText('제안서를 제출했어요.')).toBeInTheDocument();
    expect(posts).toBe(1);
  } finally {
    releaseProject();
    releaseSections();
    view.unmount();
    client.clear();
  }
});
