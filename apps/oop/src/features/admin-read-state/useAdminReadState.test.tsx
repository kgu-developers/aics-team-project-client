import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useAdminReadState } from './useAdminReadState';

const adminId = 'admin-test';
const sectionA = 'oop-2026-2-01';
const sectionB = 'oop-2026-2-02';

afterEach(() => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
});

describe('useAdminReadState', () => {
  it('같은 사용자·분반·리소스의 Hook 인스턴스를 같은 탭에서 동기화한다', () => {
    const first = renderHook(() =>
      useAdminReadState('submissions', { adminId }),
    );
    const second = renderHook(() =>
      useAdminReadState('submissions', { adminId }),
    );

    expect(second.result.current.isRead(sectionA, 'submission-1')).toBe(false);
    act(() => first.result.current.markAsRead(sectionA, 'submission-1'));
    expect(second.result.current.isRead(sectionA, 'submission-1')).toBe(true);
  });

  it('분반별 읽음 상태를 서로 섞지 않는다', () => {
    const { result } = renderHook(() =>
      useAdminReadState('meetings', { adminId }),
    );
    act(() => result.current.markAsRead(sectionA, 'meeting-1'));
    expect(result.current.isRead(sectionA, 'meeting-1')).toBe(true);
    expect(result.current.isRead(sectionB, 'meeting-1')).toBe(false);
  });

  it('사용자와 리소스 종류별 읽음 상태를 분리한다', () => {
    const meetings = renderHook(() =>
      useAdminReadState('meetings', { adminId }),
    );
    const submissions = renderHook(() =>
      useAdminReadState('submissions', { adminId }),
    );
    const otherAdmin = renderHook(() =>
      useAdminReadState('meetings', { adminId: 'other-admin' }),
    );
    act(() => meetings.result.current.markAsRead(sectionA, 'resource-1'));
    expect(submissions.result.current.isRead(sectionA, 'resource-1')).toBe(
      false,
    );
    expect(otherAdmin.result.current.isRead(sectionA, 'resource-1')).toBe(
      false,
    );
  });

  it('잘못된 localStorage 값은 오류 없이 읽지 않음으로 처리한다', () => {
    const malformedAdminId = 'admin-malformed';
    localStorage.setItem(
      `aics:admin:read:${malformedAdminId}:${sectionA}:meetings`,
      '{invalid',
    );
    const { result } = renderHook(() =>
      useAdminReadState('meetings', { adminId: malformedAdminId }),
    );
    expect(result.current.isRead(sectionA, 'meeting-1')).toBe(false);
  });

  it('다른 탭에서 localStorage를 전체 초기화하면 읽음 상태를 갱신한다', () => {
    const { result } = renderHook(() =>
      useAdminReadState('meetings', { adminId }),
    );

    act(() => result.current.markAsRead(sectionA, 'meeting-1'));
    expect(result.current.isRead(sectionA, 'meeting-1')).toBe(true);

    act(() => {
      localStorage.clear();
      window.dispatchEvent(new StorageEvent('storage', { key: null }));
    });

    expect(result.current.isRead(sectionA, 'meeting-1')).toBe(false);
  });
});
