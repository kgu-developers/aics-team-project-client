import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  getAdminMeetingReadStorageKey,
  useAdminMeetingReadState,
} from './useAdminMeetingReadState';

describe('useAdminMeetingReadState', () => {
  beforeEach(() => window.localStorage.clear());

  it('교수 계정별 회의록 읽음 상태를 브라우저에 저장한다', () => {
    const { result } = renderHook(() => useAdminMeetingReadState('admin-1'));

    expect(result.current.isRead('41')).toBe(false);

    act(() => result.current.markAsRead('41'));

    expect(result.current.isRead('41')).toBe(true);
    expect(
      JSON.parse(
        window.localStorage.getItem(
          getAdminMeetingReadStorageKey('admin-1')!,
        ) ?? '[]',
      ),
    ).toEqual(['41']);
  });

  it('다른 교수 계정의 저장 상태와 섞지 않는다', () => {
    window.localStorage.setItem(
      getAdminMeetingReadStorageKey('admin-1')!,
      JSON.stringify(['41']),
    );
    const { result } = renderHook(() => useAdminMeetingReadState('admin-2'));

    expect(result.current.isRead('41')).toBe(false);
  });
});
