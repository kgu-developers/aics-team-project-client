import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { useSelectedSection } from './useSelectedSection';

import { getMockMySections } from '~/mocks/data/sections';
import { demoStudent } from '~/mocks/data/users';

afterEach(() => useAuthStore.getState().clearSession());

it('여러 분반에서는 명시적으로 선택하고, 목록에 없는 ID는 선택하지 않는다', () => {
  useAuthStore.getState().setCurrentUser(demoStudent);
  const sections = getMockMySections('20260002', {});
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
      .setCurrentUser({ ...demoStudent, id: 'another-user' }),
  );
  rerender({ items: sections });
  expect(result.current.section).toBeUndefined();
});
