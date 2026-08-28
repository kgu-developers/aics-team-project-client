import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminMilestoneScheduleResponse,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
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

import { useAdminMilestoneScheduleQuery } from './useAdminMilestoneScheduleQuery';

const scheduleRequest = vi.fn();
const scheduleResponse: AdminMilestoneScheduleResponse = {
  sections: [
    {
      sectionId: 'oop-01',
      sectionLabel: 'OOP-01',
      memberCountLabel: '4명 / 1팀',
      milestones: [
        {
          id: 'proposal',
          isPublished: true,
          title: '제안서',
          summary: '제출 1팀',
        },
      ],
      unreadMessageCountLabel: '0건',
    },
    {
      sectionId: 'oop-02',
      sectionLabel: 'OOP-02',
      memberCountLabel: '4명 / 1팀',
      milestones: [
        {
          id: 'proposal',
          isPublished: false,
          title: '제안서',
          summary: '제출 1팀',
        },
      ],
      unreadMessageCountLabel: '0건',
    },
  ],
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SCHEDULE}`, () => {
    scheduleRequest();
    return HttpResponse.json(scheduleResponse);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  scheduleRequest.mockClear();
  server.resetHandlers();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useAdminMilestoneScheduleQuery', () => {
  it('담당 분반 ID가 없으면 일정을 요청하지 않는다', () => {
    const { result } = renderHook(() => useAdminMilestoneScheduleQuery([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(scheduleRequest).not.toHaveBeenCalled();
  });

  it('담당 분반의 일정만 화면 모델로 전달한다', async () => {
    const { result } = renderHook(
      () => useAdminMilestoneScheduleQuery(['oop-01']),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(scheduleRequest).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual({
      sections: [scheduleResponse.sections[0]],
    });
  });
});
