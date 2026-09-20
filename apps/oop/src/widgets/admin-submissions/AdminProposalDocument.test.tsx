import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminProposalDocument from './AdminProposalDocument';

import { createProjectProposalFixture } from '~/mocks/data/projectProposal';
import { demoAdmin } from '~/mocks/data/users';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});

function renderDocument(sectionId: string, teamId: string) {
  useAuthStore.setState({ currentUser: demoAdmin });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <AdminProposalDocument sectionId={sectionId} teamId={teamId} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return () => {
    view.unmount();
    client.clear();
  };
}

it.each([
  ['oop-2026-2-01', '0'],
  ['unassigned', '19'],
])(
  '분반이나 팀이 유효하지 않으면 로딩 대신 안내하고 요청하지 않는다 (%s, %s)',
  (sectionId, teamId) => {
    const requested = vi.fn();
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM(':teamId')}`,
        () => {
          requested();
          return HttpResponse.json(createProjectProposalFixture());
        },
      ),
    );
    const cleanup = renderDocument(sectionId, teamId);
    try {
      expect(screen.getByText('담당 분반과 팀을 확인해 주세요.')).toBeVisible();
      expect(
        screen.queryByText('제안서를 불러오는 중입니다.'),
      ).not.toBeInTheDocument();
      expect(requested).not.toHaveBeenCalled();
    } finally {
      cleanup();
    }
  },
);

it('유효한 문서를 실제 조회하는 동안 로딩을 표시하고 응답 후 문서를 보여준다', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => {
    release = resolve;
  });
  const project = createProjectProposalFixture();
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('19')}`,
      async () => {
        await pending;
        return HttpResponse.json(project);
      },
    ),
  );
  const cleanup = renderDocument('1', '19');
  try {
    expect(screen.getByRole('status')).toHaveTextContent(
      '제안서를 불러오는 중입니다.',
    );
    release();
    expect(
      await screen.findByRole('heading', { name: project.title }),
    ).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  } finally {
    release();
    cleanup();
  }
});

it('서버 문서의 백슬래시 기반 외부 이미지 URL을 렌더링하지 않는다', async () => {
  const project = createProjectProposalFixture();
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('19')}`, () =>
      HttpResponse.json({
        ...project,
        screenConfiguration: project.screenConfiguration.map(screen => ({
          ...screen,
          imageUrl: '/\\attacker.example/beacon.png',
        })),
      }),
    ),
  );

  const cleanup = renderDocument('1', '19');
  try {
    expect(
      await screen.findByRole('heading', { name: project.title }),
    ).toBeVisible();
    expect(screen.queryByRole('img', { name: '도서 목록' })).toBeNull();
  } finally {
    cleanup();
  }
});
