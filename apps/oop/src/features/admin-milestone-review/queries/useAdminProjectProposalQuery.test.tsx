import * as api from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { useAdminProjectProposalQuery } from './useAdminProjectProposalQuery';

import { demoAdmin, demoStudent } from '~/mocks/data/users';

afterEach(() => {
  vi.restoreAllMocks();
  useAuthStore.getState().clearSession();
});
it.each([
  [demoAdmin, 'oop-2026-2-01', undefined],
  [demoAdmin, 'oop-2026-2-01', '0'],
  [demoAdmin, 'unassigned', '1'],
  [demoStudent, 'oop-2026-2-01', '1'],
  [null, 'oop-2026-2-01', '1'],
] as const)(
  '담당 관리자와 유효한 팀이 없으면 프로젝트를 조회하지 않는다',
  (user, sectionId, teamId) => {
    useAuthStore.setState({ currentUser: user });
    const fetch = vi.spyOn(api, 'fetchProjectProposal');
    const client = new QueryClient();
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result, unmount } = renderHook(
      () => useAdminProjectProposalQuery(sectionId, teamId),
      { wrapper },
    );
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetch).not.toHaveBeenCalled();
    unmount();
    client.clear();
  },
);
