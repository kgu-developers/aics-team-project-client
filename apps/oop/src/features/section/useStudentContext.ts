import { useStudentHomeUserQuery } from '~/features/student-home/queries/useStudentHomeUserQuery';

import { useMySectionsQuery } from './queries';
import {
  resolveStudentContext,
  studentSelectableSections,
} from './resolveStudentContext';
import { useSelectedSection } from './useSelectedSection';

export function useStudentContext(enabled = true) {
  const identity = useStudentHomeUserQuery(enabled);
  const sectionsQuery = useMySectionsQuery({ status: 'ACTIVE' }, enabled);
  const sections = studentSelectableSections(identity.data, sectionsQuery.data);
  const selection = useSelectedSection(sections, identity.data?.id);
  const context = resolveStudentContext({
    user: identity.data,
    sections: sectionsQuery.data,
    selectedId: selection.section?.id,
    isPending: identity.isPending || sectionsQuery.isPending,
    isError: identity.isError || sectionsQuery.isError,
  });
  return {
    ...context,
    identity,
    sections,
    selectSection: selection.selectSection,
    user: identity.isSuccess ? identity.data : undefined,
    isFetching: identity.isFetching || sectionsQuery.isFetching,
    retry: async () => {
      if (!enabled) return;
      await Promise.all([identity.refetch(), sectionsQuery.refetch()]);
    },
  };
}
