import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import AdminStudentDetailDialog from './AdminStudentDetailDialog';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
});
afterAll(() => server.close());
it.each([404, 500])(
  'displays supplied evaluation answers when unrelated user lookup returns %s',
  async status => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.USER('20260001')}`, () =>
        HttpResponse.json({}, { status }),
      ),
    );
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    clients.push(client);
    render(
      <AstryxThemeProvider>
        <QueryClientProvider client={client}>
          <AdminStudentDetailDialog
            studentNumber='20260001'
            onClose={vi.fn()}
            details={<p>상호평가 응답: 역할 분담에 기여했습니다.</p>}
          />
        </QueryClientProvider>
      </AstryxThemeProvider>,
    );
    await screen.findByText('수강생 정보를 불러오지 못했습니다.');
    expect(
      screen.getByText('상호평가 응답: 역할 분담에 기여했습니다.'),
    ).toBeInTheDocument();
  },
);
