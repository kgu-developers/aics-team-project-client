import type { StudentMilestoneResponse } from '@aics/core';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useMilestoneScheduleClock } from './useMilestoneScheduleClock';

const due = Date.parse('2026-10-10T18:30:00+09:00');
const milestone: StudentMilestoneResponse = {
  id: 47,
  sectionId: 2,
  type: 'GENERAL',
  title: '제출',
  status: 'PUBLISHED',
  weekNumber: 1,
  allowResubmissionBeforeDueAt: false,
  schedule: { dueAt: '2026-10-10T18:30:00' },
};
let client: QueryClient;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(due - 1000);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  client.clear();
  vi.useRealTimers();
});
function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
it('화면을 유지해도 정확한 마감 시각에 서버 제출 가능 상태를 갱신한다', async () => {
  const { result, unmount } = renderHook(
    () => {
      const now = useMilestoneScheduleClock([milestone], '2', '7');
      const submission = useQuery({
        queryKey: ['student-home', 'submission', '2', '7', 47],
        queryFn: async () => ({ canSubmitNow: Date.now() < due }),
      });
      return { now, submission };
    },
    { wrapper },
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(result.current.submission.data?.canSubmitNow).toBe(true);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
  expect(result.current.now).toBeGreaterThanOrEqual(due);
  expect(result.current.submission.data?.canSubmitNow).toBe(false);
  unmount();
  expect(vi.getTimerCount()).toBeLessThanOrEqual(1); // Query cache GC may remain.
});
it('팀이 바뀌면 화면 복귀 시 새 팀의 상태만 무효화한다', async () => {
  const oldKey = ['student-home', 'submission', '2', '7', 47];
  const newKey = ['student-home', 'submission', '2', '8', 47];
  client.setQueryData(oldKey, { canSubmitNow: false });
  client.setQueryData(newKey, { canSubmitNow: false });
  const { rerender } = renderHook(
    ({ team }) => useMilestoneScheduleClock([milestone], '2', team),
    {
      wrapper,
      initialProps: { team: '7' },
    },
  );
  rerender({ team: '8' });
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(client.getQueryState(oldKey)?.isInvalidated).toBe(false);
  expect(client.getQueryState(newKey)?.isInvalidated).toBe(true);
});
it('팀 식별자가 없으면 다른 팀의 캐시를 무효화하지 않는다', async () => {
  const key = ['student-home', 'submission', '2', '7', 47];
  client.setQueryData(key, { canSubmitNow: false });
  renderHook(() => useMilestoneScheduleClock([milestone], '2'), { wrapper });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1001);
  });
  expect(client.getQueryState(key)?.isInvalidated).toBe(false);
});
