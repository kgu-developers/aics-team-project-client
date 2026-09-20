import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  getAdminSubmissionReadId,
  getAdminSubmissionReadStorageKey,
  useAdminSubmissionReadState,
} from './useAdminSubmissionReadState';

const target = {
  milestoneId: 101,
  sectionId: '1',
  submissionId: '1001',
  version: 2,
};

describe('useAdminSubmissionReadState', () => {
  beforeEach(() => window.localStorage.clear());

  it('교수 계정별로 현재 제출 버전의 읽음 상태를 브라우저에 저장한다', () => {
    const { result } = renderHook(() => useAdminSubmissionReadState('admin-1'));

    expect(result.current.isRead(target)).toBe(false);

    act(() => result.current.markAsRead(target));

    expect(result.current.isRead(target)).toBe(true);
    expect(
      JSON.parse(
        window.localStorage.getItem(
          getAdminSubmissionReadStorageKey('admin-1')!,
        ) ?? '[]',
      ),
    ).toEqual([getAdminSubmissionReadId(target)]);
  });

  it('같은 제출물이라도 새 버전은 다시 읽지 않음으로 판단한다', () => {
    const { result } = renderHook(() => useAdminSubmissionReadState('admin-1'));

    act(() => result.current.markAsRead(target));

    expect(result.current.isRead({ ...target, version: 3 })).toBe(false);
  });

  it('제출 ID 또는 버전이 없는 항목은 읽지 않음 대상으로 만들지 않는다', () => {
    expect(
      getAdminSubmissionReadId({ ...target, submissionId: null }),
    ).toBeNull();
    expect(getAdminSubmissionReadId({ ...target, version: 0 })).toBeNull();
  });
});
