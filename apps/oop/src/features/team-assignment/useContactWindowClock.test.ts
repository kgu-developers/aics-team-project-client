import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useContactWindowClock } from './useContactWindowClock';

const start = '2026-09-10T10:00:00+09:00';
const end = '2026-09-10T10:00:01+09:00';
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('열린 화면에서 시작 시각과 종료 직후에 연락처 공개 상태를 갱신한다', () => {
  vi.setSystemTime(Date.parse(start) - 1);
  const { result, unmount } = renderHook(() =>
    useContactWindowClock(start, end),
  );
  expect(result.current).toBe(Date.parse(start) - 1);
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBe(Date.parse(start));
  act(() => vi.advanceTimersByTime(1000));
  // Until is inclusive, so the clock does not close the window at equality.
  expect(result.current).toBeLessThanOrEqual(Date.parse(end));
  act(() => vi.advanceTimersByTime(1));
  expect(result.current).toBeGreaterThan(Date.parse(end));
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('백그라운드에서 복귀하면 오래된 시각 대신 현재 시각을 사용한다', () => {
  vi.setSystemTime(Date.parse(start));
  const { result, unmount } = renderHook(() =>
    useContactWindowClock(start, end),
  );
  vi.setSystemTime(Date.parse(end) + 1);
  act(() => window.dispatchEvent(new Event('focus')));
  expect(result.current).toBe(Date.parse(end) + 1);
  unmount();
});
