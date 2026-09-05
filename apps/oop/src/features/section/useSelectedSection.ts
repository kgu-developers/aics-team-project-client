import type { SectionResponse } from '@aics/core';
import { create } from 'zustand';

import { useAuthStore } from '~/features/auth/authStore';

const useSectionSelection = create<{
  selections: Record<string, number>;
  select: (userId: string, sectionId: number) => void;
}>(set => ({
  selections: {},
  select: (userId, sectionId) =>
    set(state => ({
      selections: { ...state.selections, [userId]: sectionId },
    })),
}));

/** Only one accessible section can be selected automatically. */
export function useSelectedSection(
  sections: readonly SectionResponse[] | undefined,
) {
  const userId = useAuthStore(state => state.currentUser?.id);
  const selectedId = useSectionSelection(state =>
    userId ? state.selections[userId] : undefined,
  );
  const select = useSectionSelection(state => state.select);
  const section =
    sections?.find(item => item.id === selectedId) ??
    (sections?.length === 1 ? sections[0] : undefined);
  return {
    section,
    selectSection: (id: number) => {
      if (userId && sections?.some(item => item.id === id)) select(userId, id);
    },
  };
}
