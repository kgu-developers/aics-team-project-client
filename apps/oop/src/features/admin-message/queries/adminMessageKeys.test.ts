import { describe, expect, it } from 'vitest';

import { adminMessageKeys } from './adminMessageKeys';

describe('adminMessageKeys', () => {
  it('발신자 필터 없음과 all-senders 검색어를 서로 다른 목록 캐시 키로 구분한다', () => {
    expect(adminMessageKeys.list()).not.toEqual(
      adminMessageKeys.list(undefined, 0, undefined, 'all-senders'),
    );
  });
});
