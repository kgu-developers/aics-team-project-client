import type { CurrentUser } from '@aics/core';
import { useMemo } from 'react';

import { useAuthStore } from '~/features/auth/authStore';

import { useAdminOopCoursesQuery } from './useAdminOopCoursesQuery';
import { filterActiveAdminSections } from '../model/filterActiveAdminSections';

const noSections: CurrentUser['sections'] = [];

export function useActiveAdminSections() {
  const sections = useAuthStore(
    state => state.currentUser?.sections ?? noSections,
  );
  const coursesQuery = useAdminOopCoursesQuery();
  const activeSections = useMemo(
    () =>
      coursesQuery.data
        ? filterActiveAdminSections(sections, coursesQuery.data.contents)
        : [],
    [coursesQuery.data, sections],
  );

  return {
    data: activeSections,
    isError: coursesQuery.isError,
    isPending: coursesQuery.isPending,
  };
}
