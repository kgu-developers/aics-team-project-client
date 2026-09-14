import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import TeamImportDialog from './TeamImportDialog';

const server = setupServer();
const client = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  client.clear();
  setApiAccessToken(null);
});
afterAll(() => server.close());
it('locks the section/file during apply, retains returned counts, and requires Close before another import', async () => {
  setApiAccessToken('test-token');
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  let applies = 0;
  server.use(
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_IMPORT_PREVIEW('1')}`,
      () =>
        HttpResponse.json({
          importId: 31,
          summary: {
            total: 8,
            valid: 8,
            newUser: 0,
            teams: 0,
            update: 0,
            duplicate: 0,
            invalid: 0,
          },
          rows: [],
        }),
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_IMPORT_APPLY(31)}`,
      async () => {
        applies++;
        await gate;
        return HttpResponse.json({
          importId: 31,
          createdTeams: 2,
          appliedMembers: 3,
          skipped: 5,
        });
      },
    ),
  );
  const close = vi.fn();
  const changeSection = vi.fn();
  const view = (open: boolean) => (
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <TeamImportDialog
          isOpen={open}
          onClose={close}
          onSectionChange={changeSection}
          sectionId='1'
          sections={[
            { id: '1', code: '01', name: '분반 1' },
            { id: '2', code: '02', name: '분반 2' },
          ]}
        />
      </QueryClientProvider>
    </AstryxThemeProvider>
  );
  const { rerender } = render(view(true));
  const user = userEvent.setup();
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  await user.upload(input, new File(['excel'], 'roster.xlsx'));
  await user.click(screen.getByRole('button', { name: '미리보기' }));
  await user.click(await screen.findByRole('button', { name: '반영하기' }));
  await waitFor(() => expect(applies).toBe(1));
  const section = screen.getByRole('combobox', { name: '분반' });
  expect(section).toBeDisabled();
  expect(input).toBeDisabled();
  expect(screen.getByRole('button', { name: '취소' })).toBeDisabled();
  await user.upload(input, new File(['other'], 'other.xlsx'));
  expect(screen.getByText('roster.xlsx', { exact: true })).toBeVisible();
  expect(
    screen.queryByText('other.xlsx', { exact: true }),
  ).not.toBeInTheDocument();
  await user.click(section);
  expect(changeSection).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '반영 중' }));
  expect(applies).toBe(1);
  await act(async () => release());
  const summary = await screen.findByRole('status', { name: '명단 반영 결과' });
  expect(within(summary).getByText('생성 팀 2개')).toBeVisible();
  expect(within(summary).getByText('반영 팀원 3명')).toBeVisible();
  expect(within(summary).getByText('건너뜀 5건')).toBeVisible();
  expect(close).not.toHaveBeenCalled();
  expect(section).toBeDisabled();
  expect(input).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: '반영하기' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '닫기' }));
  expect(close).toHaveBeenCalledOnce();
  rerender(view(false));
  rerender(view(true));
  expect(
    screen.queryByRole('status', { name: '명단 반영 결과' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '미리보기' })).toBeDisabled();
  expect(
    document.querySelector<HTMLInputElement>('input[type="file"]')?.files,
  ).toHaveLength(0);
});
