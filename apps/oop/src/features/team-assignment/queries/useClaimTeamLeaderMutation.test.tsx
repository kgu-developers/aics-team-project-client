import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { authKeys } from '~/features/auth/queries/authKeys';
import { useStudentHomeUserQuery } from '~/features/student-home/queries/useStudentHomeUserQuery';

import { useClaimTeamLeaderMutation } from './useClaimTeamLeaderMutation';
import { useTeamKickoffQuery } from './useTeamKickoffQuery';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

it.each([204, 409, 503])(
  'refreshes canonical identity and kickoff after claim success/conflict, but not server failure (%i)',
  async status => {
    let claimed = false;
    let identityReads = 0;
    let kickoffReads = 0;
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () => {
        identityReads++;
        return HttpResponse.json({
          studentNumber: demoStudent.studentNumber,
          name: claimed ? '갱신 학생' : '기존 학생',
          globalRole: 'USER',
          teamId: 7,
          sections: [],
        });
      }),
      http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () => {
        kickoffReads++;
        return HttpResponse.json({
          id: 7,
          name: claimed ? '갱신 팀' : '기존 팀',
          members: [],
        });
      }),
      http.post(`${API_BASE_URL}${ENDPOINTS.TEAM.LEADER_CLAIM('7')}`, () => {
        claimed = status !== 503;
        return new HttpResponse(null, { status });
      }),
    );
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().markAuthenticated('STUDENT');
    useAuthStore.getState().setCurrentUser(demoStudent);
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    clients.push(client);
    client.setQueryData(authKeys.currentUser(), demoStudent);
    const wrapper = ({ children }: PropsWithChildren) => (
      <AstryxThemeProvider>
        <QueryClientProvider client={client}>
          <ToastViewport>{children}</ToastViewport>
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
    const { result } = renderHook(
      () => ({
        identity: useStudentHomeUserQuery(),
        kickoff: useTeamKickoffQuery('7'),
        claim: useClaimTeamLeaderMutation(),
      }),
      { wrapper },
    );
    await waitFor(() =>
      expect(result.current.identity.data?.name).toBe('기존 학생'),
    );
    await waitFor(() =>
      expect(result.current.kickoff.data?.name).toBe('기존 팀'),
    );
    await act(async () => {
      const claim = result.current.claim.mutateAsync({
        input: { teamId: '7' },
      });
      if (status === 204) await claim;
      else await expect(claim).rejects.toMatchObject({ response: { status } });
    });
    await waitFor(() =>
      expect(result.current.identity.data?.name).toBe(
        status === 503 ? '기존 학생' : '갱신 학생',
      ),
    );
    expect(result.current.kickoff.data?.name).toBe(
      status === 503 ? '기존 팀' : '갱신 팀',
    );
    expect(identityReads).toBe(status === 503 ? 1 : 2);
    expect(kickoffReads).toBe(status === 503 ? 1 : 2);
    expect(client.getQueryState(authKeys.currentUser())?.isInvalidated).toBe(
      status !== 503,
    );
  },
);
