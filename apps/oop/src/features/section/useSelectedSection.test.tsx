import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { useSelectedSection } from './useSelectedSection';

import { getMockMySections } from '~/mocks/data/sections';
import { demoStudent } from '~/mocks/data/users';

afterEach(() => useAuthStore.getState().clearSession());

it('여러 분반에서는 명시적으로 선택하고, 목록에 없는 ID는 선택하지 않는다', () => {
  // 선택값은 사용자 ID별로 보존된다. 다른 테스트가 사용하는 데모 계정과
  // 분리해, 이전 테스트의 선택값이 이 테스트의 초기 상태를 바꾸지 않게 한다.
  const testStudent = { ...demoStudent, id: 'selected-section-test-user' };
  useAuthStore.getState().setCurrentUser(testStudent);
  const [firstSection] = getMockMySections('20260002', {});

  if (!firstSection) {
    throw new Error('분반 선택 테스트에 필요한 기본 fixture가 없습니다.');
  }

  const sections = [firstSection, { ...firstSection, id: 2 }];
  const { result, rerender } = renderHook(
    ({ items }) => useSelectedSection(items),
    { initialProps: { items: sections } },
  );
  expect(result.current.section).toBeUndefined();
  act(() => result.current.selectSection(99));
  expect(result.current.section).toBeUndefined();
  act(() => result.current.selectSection(2));
  expect(result.current.section?.id).toBe(2);
  rerender({ items: [] });
  expect(result.current.section).toBeUndefined();
  act(() =>
    useAuthStore
      .getState()
      .setCurrentUser({ ...testStudent, id: 'another-user' }),
  );
  rerender({ items: sections });
  expect(result.current.section).toBeUndefined();
});
