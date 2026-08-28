import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  getStudentNoticeReadStorageKey,
  useStudentNoticeReadState,
} from './useStudentNoticeReadState';

describe('useStudentNoticeReadState', () => {
  afterEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('다른 탭에서 읽음 저장소가 전체 삭제되면 현재 읽음 상태도 초기화한다', () => {
    const storageKey = getStudentNoticeReadStorageKey('student-1', 'section-1');
    if (!storageKey) throw new Error('storage key is required');
    window.localStorage.setItem(storageKey, JSON.stringify(['notice-1']));

    const { result } = renderHook(() =>
      useStudentNoticeReadState('student-1', 'section-1'),
    );
    expect(result.current.isRead('notice-1')).toBe(true);

    window.localStorage.clear();
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: null,
          storageArea: window.sessionStorage,
        }),
      );
    });
    expect(result.current.isRead('notice-1')).toBe(true);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: null,
          storageArea: window.localStorage,
        }),
      );
    });
    expect(result.current.isRead('notice-1')).toBe(false);
  });

  it('같은 localStorage 키의 변경만 현재 읽음 상태에 반영한다', () => {
    const storageKey = getStudentNoticeReadStorageKey('student-1', 'section-1');
    if (!storageKey) throw new Error('storage key is required');

    const { result } = renderHook(() =>
      useStudentNoticeReadState('student-1', 'section-1'),
    );
    window.localStorage.setItem(storageKey, JSON.stringify(['notice-1']));

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'unrelated-key',
          storageArea: window.localStorage,
        }),
      );
    });
    expect(result.current.isRead('notice-1')).toBe(false);

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: storageKey,
          storageArea: window.localStorage,
        }),
      );
    });
    expect(result.current.isRead('notice-1')).toBe(true);
  });
});
