import {
  API_BASE_URL,
  ENDPOINTS,
  fetchCurrentProposal,
  InvalidProposalResponseError,
} from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import ProposalEditorPage from './ProposalEditorPage';

import { getCurrentProposal } from '~/mocks/data/proposal';
import { demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

const server = setupServer();
const url = `${API_BASE_URL}${ENDPOINTS.PROPOSAL.CURRENT}`;
let client: QueryClient | undefined;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  client?.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
it.each([
  '<!doctype html><html>Vite fallback</html>',
  {},
  { id: 17, title: '프로젝트 DTO' },
  { id: '17', version: 1, blocks: [{}] },
])('편집 문서가 아닌 응답을 거절한다: %o', async payload => {
  server.use(
    http.get(url, () =>
      typeof payload === 'string'
        ? HttpResponse.html(payload)
        : HttpResponse.json(payload),
    ),
  );
  await expect(fetchCurrentProposal()).rejects.toBeInstanceOf(
    InvalidProposalResponseError,
  );
});
it('유효한 기존 MSW 편집 문서는 그대로 읽는다', async () => {
  const document = getCurrentProposal();
  server.use(http.get(url, () => HttpResponse.json(document)));
  expect(await fetchCurrentProposal()).toEqual(document);
});
it('HTML 200 응답에도 오류 경계로 추락하지 않고 안내와 홈 복귀 버튼을 표시한다', async () => {
  const read = vi.fn(() =>
    HttpResponse.html('<!doctype html><html>Vite fallback</html>'),
  );
  server.use(http.get(url, read));
  useAuthStore.getState().setCurrentUser(demoStudent);
  client = new QueryClient();
  renderWithRouter(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <ToastViewport>
          <ProposalEditorPage section='team-info' />
        </ToastViewport>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  expect(
    await screen.findByText('제안서 작성 기능을 준비 중이에요.'),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '학생 홈으로 돌아가기' }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/Cannot read/)).not.toBeInTheDocument();
  expect(read).toHaveBeenCalledTimes(1);
});
