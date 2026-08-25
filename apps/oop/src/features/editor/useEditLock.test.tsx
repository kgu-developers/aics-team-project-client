import type { EditLockStatus, EditLockTarget } from '@aics/core';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  acquireEditLock: vi.fn(),
  removeEditLock: vi.fn(),
}));

vi.mock('@aics/api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@aics/api-client')>()),
  acquireEditLock: api.acquireEditLock,
  removeEditLock: api.removeEditLock,
}));

import { useEditLock } from './useEditLock';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function acquired(
  target: EditLockTarget,
  leaseId = `lease-${target.targetId}`,
): EditLockStatus {
  return {
    ...target,
    leaseId,
    locked: true,
    lockedAt: '2026-08-24T10:00:00+09:00',
    lockedBy: 'OOP 데모 학생 A',
  };
}

const firstTarget: EditLockTarget = {
  targetType: 'PROJECT_BLOCK',
  targetId: 'proposal:team-info',
};
const secondTarget: EditLockTarget = {
  targetType: 'PROJECT_BLOCK',
  targetId: 'proposal:topic',
};

describe('useEditLock', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('target 변경 즉시 이전 상태를 버리고 pending으로 표시하며 null은 초기화한다', async () => {
    const secondAcquire = deferred<EditLockStatus>();
    api.acquireEditLock
      .mockRejectedValueOnce({ response: { data: { lockedBy: '다른 팀원' } } })
      .mockImplementationOnce(() => secondAcquire.promise);
    const initialProps: { target: EditLockTarget | null } = {
      target: firstTarget,
    };
    const { result, rerender } = renderHook(
      ({ target }: { target: EditLockTarget | null }) => useEditLock(target),
      { initialProps },
    );

    await act(async () => undefined);
    expect(result.current).toEqual({
      locked: true,
      ownerName: '다른 팀원',
      pending: false,
    });

    rerender({ target: secondTarget });
    expect(result.current).toEqual({
      locked: false,
      ownerName: null,
      pending: true,
    });

    rerender({ target: null });
    expect(result.current).toEqual({
      locked: false,
      ownerName: null,
      pending: false,
    });

    await act(async () => {
      secondAcquire.resolve(acquired(secondTarget));
    });
    expect(api.removeEditLock).toHaveBeenCalledWith({
      ...secondTarget,
      leaseId: `lease-${secondTarget.targetId}`,
    });
    expect(result.current).toEqual({
      locked: false,
      ownerName: null,
      pending: false,
    });
  });

  it('이전 target의 늦은 acquire 성공을 해제하고 현재 target 상태를 유지한다', async () => {
    const firstAcquire = deferred<EditLockStatus>();
    const secondAcquire = deferred<EditLockStatus>();
    api.acquireEditLock.mockImplementation((target: EditLockTarget) =>
      target.targetId === firstTarget.targetId
        ? firstAcquire.promise
        : secondAcquire.promise,
    );
    const { result, rerender, unmount } = renderHook(
      ({ target }: { target: EditLockTarget | null }) => useEditLock(target),
      { initialProps: { target: firstTarget } },
    );

    rerender({ target: secondTarget });
    await act(async () => {
      secondAcquire.resolve(acquired(secondTarget));
    });
    expect(result.current).toEqual({
      locked: false,
      ownerName: null,
      pending: false,
    });

    await act(async () => {
      firstAcquire.resolve(acquired(firstTarget));
    });
    expect(api.removeEditLock).toHaveBeenCalledWith({
      ...firstTarget,
      leaseId: `lease-${firstTarget.targetId}`,
    });
    expect(result.current).toEqual({
      locked: false,
      ownerName: null,
      pending: false,
    });

    unmount();
    await act(async () => undefined);
    expect(api.removeEditLock).toHaveBeenCalledWith({
      ...secondTarget,
      leaseId: `lease-${secondTarget.targetId}`,
    });
  });

  it('같은 target의 이전 acquire가 늦게 끝나도 해당 lease만 해제한다', async () => {
    const firstAcquire = deferred<EditLockStatus>();
    const secondAcquire = deferred<EditLockStatus>();
    api.acquireEditLock
      .mockImplementationOnce(() => firstAcquire.promise)
      .mockImplementationOnce(() => secondAcquire.promise);

    const firstView = renderHook(() => useEditLock(firstTarget));
    firstView.unmount();
    const secondView = renderHook(() => useEditLock(firstTarget));

    await act(async () => {
      secondAcquire.resolve(acquired(firstTarget, 'lease-current-tab'));
    });
    await act(async () => {
      firstAcquire.resolve(acquired(firstTarget, 'lease-closed-tab'));
    });

    expect(api.removeEditLock).toHaveBeenCalledTimes(1);
    expect(api.removeEditLock).toHaveBeenCalledWith({
      ...firstTarget,
      leaseId: 'lease-closed-tab',
    });

    secondView.unmount();
    await act(async () => undefined);
    expect(api.removeEditLock).toHaveBeenCalledTimes(2);
    expect(api.removeEditLock).toHaveBeenLastCalledWith({
      ...firstTarget,
      leaseId: 'lease-current-tab',
    });
  });

  it('해제 중 heartbeat 응답이 늦게 도착해도 다시 해제한다', async () => {
    vi.useFakeTimers();
    const heartbeat = deferred<EditLockStatus>();
    api.acquireEditLock
      .mockResolvedValueOnce(acquired(firstTarget))
      .mockImplementationOnce(() => heartbeat.promise);
    const { unmount } = renderHook(() => useEditLock(firstTarget));

    await act(async () => undefined);
    await act(async () => {
      vi.advanceTimersByTime(45_000);
    });
    expect(api.acquireEditLock).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => undefined);
    expect(api.removeEditLock).toHaveBeenCalledTimes(1);

    await act(async () => {
      heartbeat.resolve(acquired(firstTarget));
    });
    expect(api.removeEditLock).toHaveBeenCalledTimes(2);
  });

  it('마지막 draft 저장이 끝난 뒤 현재 lease를 해제한다', async () => {
    const draftFlush = deferred<void>();
    api.acquireEditLock.mockResolvedValueOnce(
      acquired(firstTarget, 'lease-with-dirty-draft'),
    );
    const beforeRelease = vi.fn(() => draftFlush.promise);
    const { unmount } = renderHook(() =>
      useEditLock(firstTarget, beforeRelease),
    );

    await act(async () => undefined);
    unmount();
    await act(async () => undefined);

    expect(beforeRelease).toHaveBeenCalledWith(firstTarget);
    expect(api.removeEditLock).not.toHaveBeenCalled();

    await act(async () => {
      draftFlush.resolve();
    });
    expect(api.removeEditLock).toHaveBeenCalledWith({
      ...firstTarget,
      leaseId: 'lease-with-dirty-draft',
    });
  });
});
